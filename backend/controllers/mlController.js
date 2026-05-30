/**
 * ML Controller
 * Handles predictions using the trained Random Forest model
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the trained model and Python prediction script
const MODEL_PATH = path.join(__dirname, '../../ML/models/random_forest_model.pkl');
const PREDICT_SCRIPT = path.join(__dirname, '../../ML/predict.py');

/**
 * Make ML prediction for a worker based on their attendance data
 */
exports.predictWorkerCategory = async (req, res) => {
  try {
    const { worker_data } = req.body;

    if (!worker_data) {
      return res.status(400).json({
        success: false,
        error: 'Worker data is required'
      });
    }

    // Validate required fields
    const requiredFields = [
      'is_late', 'absences_30d', 'attendance_rate', 'overtime_hours',
      'total_hours_worked', 'day_of_week', 'check_in_hour', 'check_out_hour',
      'shift_type_encoded', 'is_present'
    ];

    for (const field of requiredFields) {
      if (worker_data[field] === undefined) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Call Python prediction script
    const prediction = await makePrediction(worker_data);

    res.json({
      success: true,
      prediction: {
        category: prediction.category,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities,
        risk_level: getRiskLevel(prediction.category),
        recommendations: getRecommendations(prediction.category)
      }
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make prediction',
      details: error.message
    });
  }
};

/**
 * Get prediction for a specific worker from database
 */
exports.getWorkerPrediction = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { supabase } = req;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        error: 'Worker ID is required'
      });
    }

    // 1. First look for pre-calculated supervisor prediction cache
    try {
      const { data: cachedNotif, error: cacheError } = await supabase
        .from('notifications')
        .select('message, created_at')
        .eq('worker_id', workerId)
        .eq('type', 'ml_prediction')
        .single();

      if (!cacheError && cachedNotif && cachedNotif.message) {
        const cachedPred = JSON.parse(cachedNotif.message);
        return res.json({
          success: true,
          worker_id: workerId,
          cached: true,
          calculated_at: cachedNotif.created_at,
          prediction: {
            category: cachedPred.category,
            confidence: cachedPred.confidence,
            probabilities: cachedPred.probabilities,
            risk_level: cachedPred.risk_level,
            recommendations: cachedPred.recommendations
          },
          statistics: {
            total_records: cachedPred.days_recorded || 7,
            days_recorded: cachedPred.days_recorded || 7,
            attendance_rate: cachedPred.attendance_rate || 100,
            absences_30d: cachedPred.absences_30d || 0,
            avg_hours_worked: cachedPred.avg_hours_worked || 8,
            late_arrivals: cachedPred.late_arrivals || 0
          }
        });
      }
    } catch (cacheLookupErr) {
      console.warn('Failed to load cached prediction, falling back to live calculation:', cacheLookupErr.message);
    }

    // Fetch worker attendance data from Supabase
    const { data: workerData, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('worker_id', workerId)
      .order('date', { ascending: false })
      .limit(30);

    if (fetchError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch worker data'
      });
    }

    if (!workerData || workerData.length < 7) {
      return res.json({
        success: true,
        insufficient: true,
        days_recorded: workerData ? workerData.length : 0,
        worker_id: workerId,
        message: 'At least 7 days of attendance history required to generate behavioral model.'
      });
    }

    // Aggregate worker statistics
    const workerStats = aggregateWorkerStats(workerData);

    // Make prediction
    const prediction = await makePrediction(workerStats);

    res.json({
      success: true,
      worker_id: workerId,
      prediction: {
        category: prediction.category,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities,
        risk_level: getRiskLevel(prediction.category),
        recommendations: getRecommendations(prediction.category)
      },
      statistics: {
        total_records: workerData.length,
        attendance_rate: workerStats.attendance_rate,
        absences_30d: workerStats.absences_30d,
        avg_hours_worked: workerStats.total_hours_worked,
        late_arrivals: workerStats.is_late
      }
    });

  } catch (error) {
    console.error('Worker prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get worker prediction',
      details: error.message
    });
  }
};

/**
 * Predict for multiple workers (batch prediction)
 */
exports.batchPrediction = async (req, res) => {
  try {
    const { workers_data } = req.body;

    if (!Array.isArray(workers_data)) {
      return res.status(400).json({
        success: false,
        error: 'workers_data must be an array'
      });
    }

    const predictions = [];
    for (const workerData of workers_data) {
      try {
        const prediction = await makePrediction(workerData);
        predictions.push({
          worker_id: workerData.worker_id,
          prediction: prediction.category,
          confidence: prediction.confidence,
          risk_level: getRiskLevel(prediction.category)
        });
      } catch (error) {
        predictions.push({
          worker_id: workerData.worker_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      total: predictions.length,
      predictions
    });

  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch prediction failed',
      details: error.message
    });
  }
};

/**
 * Helper: Make prediction using Python child process
 */
function makePrediction(workerData) {
  return new Promise((resolve, reject) => {
    const venvPython = path.join(__dirname, '../../ML/venv/Scripts/python.exe');
    const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python';

    // Spawn Python process and send JSON via stdin to avoid argument quoting issues
    const python = spawn(pythonCmd, [PREDICT_SCRIPT]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Write the worker data JSON to the Python process stdin
    try {
      python.stdin.write(JSON.stringify(workerData));
      python.stdin.end();
    } catch (stdinErr) {
      console.error('Failed to write to Python stdin:', stdinErr.message);
    }

    python.on('close', (code) => {
      try {
        // Try to parse output regardless of stderr (it might just be warnings)
        if (output.trim()) {
          const result = JSON.parse(output);
          resolve(result);
          return;
        }

        // If no output but code is 0, it might have succeeded
        if (code === 0) {
          reject(new Error('No output from prediction script'));
          return;
        }

        // Filter out sklearn warnings
        const hasRealError = errorOutput
          .split('\n')
          .some(line => line.includes('Error') || line.includes('Exception') || (line.includes('Traceback') && !line.includes('InconsistentVersionWarning')));

        if (hasRealError) {
          reject(new Error(`Prediction script failed: ${errorOutput}`));
        } else {
          // Just warnings, treat as success if output exists
          reject(new Error(`Prediction failed: ${errorOutput}`));
        }
      } catch (parseError) {
        reject(new Error(`Invalid prediction output: ${output} | Error: ${parseError.message}`));
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });
  });
}

/**
 * Helper: Aggregate worker statistics from attendance records
 */
function aggregateWorkerStats(attendanceRecords) {
  const stats = {
    is_late: 0,
    absences_30d: 0,
    attendance_rate: 0,
    overtime_hours: 0,
    total_hours_worked: 0,
    day_of_week: 1,
    check_in_hour: 8,
    check_out_hour: 17,
    shift_type_encoded: 1,
    is_present: 0
  };

  if (attendanceRecords.length === 0) return stats;

  // Count late arrivals
  stats.is_late = attendanceRecords.filter(r => r.is_late).length;

  // Count absences in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  stats.absences_30d = attendanceRecords
    .filter(r => new Date(r.date) > thirtyDaysAgo && !r.check_in)
    .length;

  // Calculate attendance rate
  const presentDays = attendanceRecords.filter(r => r.check_in).length;
  stats.attendance_rate = (presentDays / attendanceRecords.length) * 100;

  // Aggregate hours
  stats.overtime_hours = attendanceRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0) / attendanceRecords.length;
  stats.total_hours_worked = attendanceRecords.reduce((sum, r) => sum + (r.total_hours_worked || 0), 0) / attendanceRecords.length;

  // Get most recent check-in hour
  const recentRecord = attendanceRecords.find(r => r.check_in);
  if (recentRecord && recentRecord.check_in) {
    const [hour] = recentRecord.check_in.split(':');
    stats.check_in_hour = parseInt(hour);
  }

  // Presence indicator
  stats.is_present = presentDays > 0 ? 1 : 0;

  return stats;
}

/**
 * Helper: Determine risk level based on category
 */
function getRiskLevel(category) {
  const riskMap = {
    'Regular': 'LOW',
    'Irregular': 'MEDIUM',
    'High_Risk': 'HIGH'
  };
  return riskMap[category] || 'UNKNOWN';
}

/**
 * Helper: Get recommendations based on prediction
 */
function getRecommendations(category) {
  const recommendations = {
    'Regular': [
      'Continue recognizing and rewarding consistent attendance',
      'Worker is a reliable team member',
      'No immediate action needed'
    ],
    'Irregular': [
      'Schedule discussion to understand attendance challenges',
      'Monitor attendance patterns closely',
      'Consider flexible scheduling or support options',
      'Track progress over next 30 days'
    ],
    'High_Risk': [
      'Urgent: Schedule meeting with worker',
      'Investigate root causes of absenteeism',
      'Develop attendance improvement plan',
      'Consider performance management steps if needed',
      'Provide support resources (if available)',
      'Increase monitoring frequency'
    ]
  };
  return recommendations[category] || [];
}

/**
 * GET /api/ml/predictions - Get predictions for all active workers
 */
exports.getAllWorkerPredictions = async (req, res) => {
  try {
    const db = require('../config/db').supabase;

    // 1. Fetch all active workers
    const { data: workers, error: workersError } = await db
      .from('workers')
      .select('worker_id, name, job_type, contractor_name')
      .eq('is_active', true);

    if (workersError) throw workersError;

    if (!workers || workers.length === 0) {
      return res.json({
        success: true,
        predictions: []
      });
    }

    // 2. Fetch today's date and get attendance records for these workers
    // (up to 30 records per worker to calculate statistics)
    const workerIds = workers.map(w => w.worker_id);
    
    // We can query all attendance records for these workers in a single query to be highly efficient!
    const { data: attendanceData, error: attendanceError } = await db
      .from('attendance')
      .select('*')
      .in('worker_id', workerIds)
      .order('date', { ascending: false });

    if (attendanceError) throw attendanceError;

    // Group attendance records by worker_id
    const attendanceMap = {};
    workerIds.forEach(id => {
      attendanceMap[id] = [];
    });
    (attendanceData || []).forEach(record => {
      if (attendanceMap[record.worker_id]) {
        // Limit to 30 records
        if (attendanceMap[record.worker_id].length < 30) {
          attendanceMap[record.worker_id].push(record);
        }
      }
    });

    const predictions = [];

    // Make batch prediction calls
    for (const worker of workers) {
      const records = attendanceMap[worker.worker_id] || [];
      
      // If a worker has less than 7 records, let's assign insufficient status
      if (records.length < 7) {
        predictions.push({
          worker_id: worker.worker_id,
          name: worker.name,
          job_type: worker.job_type,
          contractor_name: worker.contractor_name || 'General Contractors',
          insufficient: true,
          days_recorded: records.length,
          prediction: {
            category: 'Insufficient Data',
            confidence: 0.0,
            probabilities: {},
            risk_level: 'UNKNOWN',
            recommendations: ['Requires at least 7 days of attendance history to calibrate behavior models.']
          }
        });
        continue;
      }

      // Aggregate worker statistics
      const stats = aggregateWorkerStats(records);

      try {
        const prediction = await makePrediction(stats);
        const predictionPayload = {
          category: prediction.category,
          confidence: prediction.confidence,
          probabilities: prediction.probabilities,
          risk_level: getRiskLevel(prediction.category),
          recommendations: getRecommendations(prediction.category)
        };

        predictions.push({
          worker_id: worker.worker_id,
          name: worker.name,
          job_type: worker.job_type,
          contractor_name: worker.contractor_name || 'General Contractors',
          prediction: predictionPayload
        });

        // Cache predictions into notifications table for instant worker retrieval
        try {
          const predictionToCache = {
            ...predictionPayload,
            days_recorded: records.length,
            calculated_at: new Date().toISOString()
          };

          const { data: existingCache } = await db
            .from('notifications')
            .select('id')
            .eq('worker_id', worker.worker_id)
            .eq('type', 'ml_prediction')
            .single();

          if (existingCache) {
            await db
              .from('notifications')
              .update({
                message: JSON.stringify(predictionToCache),
                is_read: false,
                created_at: new Date().toISOString()
              })
              .eq('id', existingCache.id);
          } else {
            await db
              .from('notifications')
              .insert([{
                worker_id: worker.worker_id,
                message: JSON.stringify(predictionToCache),
                type: 'ml_prediction',
                is_read: false
              }]);
          }
        } catch (cacheErr) {
          console.error(`Failed to cache prediction for worker ${worker.worker_id}:`, cacheErr.message);
        }
      } catch (predErr) {
        console.error(`Prediction failed for worker ${worker.worker_id}:`, predErr.message);
        // Fallback to in-memory simple rule if python fails (to guarantee resilience)
        const simpleCategory = stats.attendance_rate < 60 ? 'High_Risk' : stats.attendance_rate < 90 ? 'Irregular' : 'Regular';
        const fallbackPayload = {
          category: simpleCategory,
          confidence: 0.8,
          probabilities: {},
          risk_level: getRiskLevel(simpleCategory),
          recommendations: getRecommendations(simpleCategory)
        };

        predictions.push({
          worker_id: worker.worker_id,
          name: worker.name,
          job_type: worker.job_type,
          contractor_name: worker.contractor_name || 'General Contractors',
          prediction: fallbackPayload
        });

        // Cache fallback predictions into notifications table
        try {
          const predictionToCache = {
            ...fallbackPayload,
            days_recorded: records.length,
            calculated_at: new Date().toISOString()
          };

          const { data: existingCache } = await db
            .from('notifications')
            .select('id')
            .eq('worker_id', worker.worker_id)
            .eq('type', 'ml_prediction')
            .single();

          if (existingCache) {
            await db
              .from('notifications')
              .update({
                message: JSON.stringify(predictionToCache),
                is_read: false,
                created_at: new Date().toISOString()
              })
              .eq('id', existingCache.id);
          } else {
            await db
              .from('notifications')
              .insert([{
                worker_id: worker.worker_id,
                message: JSON.stringify(predictionToCache),
                type: 'ml_prediction',
                is_read: false
              }]);
          }
        } catch (cacheErr) {
          console.error(`Failed to cache fallback prediction for worker ${worker.worker_id}:`, cacheErr.message);
        }
      }
    }

    res.json({
      success: true,
      predictions
    });

  } catch (error) {
    console.error('All workers predictions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get predictions',
      details: error.message
    });
  }
};

module.exports = exports;
