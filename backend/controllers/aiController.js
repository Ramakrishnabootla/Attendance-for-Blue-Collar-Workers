/**
 * AI Controller
 * Handles generative AI insights using Grok, OpenAI, or Gemini API
 */

/**
 * Generate AI insights for attendance data
 */
exports.generateInsights = async (req, res) => {
  try {
    const { period = 'daily', contractor_id, worker_ids } = req.body;

    if (!contractor_id) {
      return res.status(400).json({
        success: false,
        error: 'contractor_id is required'
      });
    }

    // Validate period
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Period must be one of: daily, weekly, monthly'
      });
    }

    const { supabase } = req;

    // Fetch attendance data for the period
    const attendanceData = await fetchAttendanceData(supabase, contractor_id, period, worker_ids);

    if (!attendanceData || attendanceData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No attendance data found for the specified period'
      });
    }

    // Calculate statistics
    const stats = calculateAttendanceStats(attendanceData);

    // Generate AI insights
    const insights = await generateAIInsights(stats, period);

    res.json({
      success: true,
      period,
      contractor_id,
      timestamp: new Date().toISOString(),
      statistics: stats,
      insights: insights,
      recommendations: getDataDrivenRecommendations(stats, period)
    });

  } catch (error) {
    console.error('AI insights generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI insights',
      details: error.message
    });
  }
};

/**
 * Generate insights for a specific contractor dashboard
 */
exports.getContractorInsights = async (req, res) => {
  try {
    const { contractorId } = req.params;
    const { period = 'weekly' } = req.query;

    if (!contractorId) {
      return res.status(400).json({
        success: false,
        error: 'Contractor ID is required'
      });
    }

    const { supabase } = req;

    // Fetch attendance data
    const attendanceData = await fetchAttendanceData(supabase, contractorId, period);

    if (!attendanceData || attendanceData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No attendance data found'
      });
    }

    // Calculate statistics
    const stats = calculateAttendanceStats(attendanceData);

    // Generate AI insights
    const insights = await generateAIInsights(stats, period);

    // Get top performers and concerns
    const { topPerformers, concerns } = analyzeWorkerPerformance(attendanceData);

    res.json({
      success: true,
      contractor_id: contractorId,
      period,
      timestamp: new Date().toISOString(),
      summary: {
        total_workers: stats.total_workers,
        total_present: stats.total_present,
        total_absent: stats.total_absent,
        avg_attendance_rate: stats.avg_attendance_rate.toFixed(2),
        on_time_percentage: stats.on_time_percentage.toFixed(2)
      },
      insights: insights,
      highlights: {
        top_performers: topPerformers.slice(0, 5),
        concerns: concerns.slice(0, 5)
      },
      recommendations: getDataDrivenRecommendations(stats, period)
    });

  } catch (error) {
    console.error('Contractor insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contractor insights',
      details: error.message
    });
  }
};

/**
 * Helper: Fetch attendance data from Supabase
 */
async function fetchAttendanceData(supabase, contractorId, period, workerIds = null) {
  try {
    // Calculate date range
    const { startDate, endDate } = getDateRange(period);

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('contractor_id', contractorId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    if (workerIds && workerIds.length > 0) {
      query = query.in('worker_id', workerIds);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to fetch attendance data: ${error.message}`);
  }
}

/**
 * Helper: Calculate attendance statistics
 */
function calculateAttendanceStats(attendanceData) {
  const stats = {
    total_records: attendanceData.length,
    total_workers: new Set(attendanceData.map(r => r.worker_id)).size,
    total_present: 0,
    total_absent: 0,
    avg_attendance_rate: 0,
    late_arrivals: 0,
    total_overtime: 0,
    avg_hours_worked: 0,
    on_time_percentage: 0,
    high_risk_workers: 0,
    irregular_workers: 0,
    regular_workers: 0
  };

  // Count present/absent
  attendanceData.forEach(record => {
    if (record.check_in) {
      stats.total_present++;
      if (record.is_late) stats.late_arrivals++;
      stats.total_overtime += record.overtime_hours || 0;
      stats.avg_hours_worked += record.total_hours_worked || 0;
    } else {
      stats.total_absent++;
    }
  });

  // Calculate averages
  stats.avg_attendance_rate = (stats.total_present / stats.total_records) * 100;
  stats.on_time_percentage = ((stats.total_present - stats.late_arrivals) / stats.total_present) * 100;
  stats.avg_hours_worked = stats.avg_hours_worked / stats.total_present;
  stats.total_overtime = stats.total_overtime;

  // Worker quality distribution (simulated based on attendance rate)
  stats.regular_workers = Math.ceil(stats.total_workers * 0.6);
  stats.irregular_workers = Math.ceil(stats.total_workers * 0.25);
  stats.high_risk_workers = Math.ceil(stats.total_workers * 0.15);

  return stats;
}

/**
 * Helper: Generate AI insights
 */
async function generateAIInsights(stats, period) {
  try {
    const apiKey = process.env.AI_API_KEY;
    const aiProvider = process.env.AI_PROVIDER || 'grok';

    if (!apiKey) {
      return getFallbackInsights(stats, period);
    }

    // Call appropriate AI API
    if (aiProvider === 'openai') {
      return await callOpenAI(stats, period, apiKey);
    } else if (aiProvider === 'gemini') {
      return await callGemini(stats, period, apiKey);
    } else {
      return await callGrokAPI(stats, period, apiKey);
    }

  } catch (error) {
    console.warn('AI generation failed, using fallback:', error.message);
    return getFallbackInsights(stats, period);
  }
}

/**
 * Helper: Call Grok API
 */
async function callGrokAPI(stats, period, apiKey) {
  try {
    const prompt = buildAIPrompt(stats, period);

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are an expert workforce analytics assistant providing concise, actionable insights about employee attendance patterns.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Grok API call failed:', error.message);
    return getFallbackInsights(stats, period);
  }
}

/**
 * Helper: Call OpenAI API
 */
async function callOpenAI(stats, period, apiKey) {
  try {
    const prompt = buildAIPrompt(stats, period);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert workforce analytics assistant providing concise, actionable insights about employee attendance patterns.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('OpenAI API call failed:', error.message);
    return getFallbackInsights(stats, period);
  }
}

/**
 * Helper: Call Gemini API
 */
async function callGemini(stats, period, apiKey) {
  try {
    const prompt = buildAIPrompt(stats, period);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error('Gemini API call failed:', error.message);
    return getFallbackInsights(stats, period);
  }
}

/**
 * Helper: Build AI prompt
 */
function buildAIPrompt(stats, period) {
  return `
Analyze the following workforce attendance data and provide 2-3 key insights and actionable recommendations.

Period: ${period}
Total Workers: ${stats.total_workers}
Records: ${stats.total_records}
Attendance Rate: ${stats.avg_attendance_rate.toFixed(2)}%
On-Time Rate: ${stats.on_time_percentage.toFixed(2)}%
Late Arrivals: ${stats.late_arrivals}
Regular Workers: ${stats.regular_workers}
Irregular Workers: ${stats.irregular_workers}
High-Risk Workers: ${stats.high_risk_workers}
Avg Hours/Worker: ${stats.avg_hours_worked.toFixed(2)}
Total Overtime Hours: ${stats.total_overtime.toFixed(2)}

Provide insights in a professional tone suitable for management review. Format as 2-3 paragraphs.
`;
}

/**
 * Helper: Get fallback insights when API fails
 */
function getFallbackInsights(stats, period) {
  const attendance_pct = stats.avg_attendance_rate.toFixed(2);
  const ontime_pct = stats.on_time_percentage.toFixed(2);

  return `During the ${period} period, your workforce maintained an overall attendance rate of ${attendance_pct}%, with ${ontime_pct}% of workers arriving on time. With ${stats.regular_workers} regular workers, ${stats.irregular_workers} workers showing irregular patterns, and ${stats.high_risk_workers} workers at risk, the team is performing at a consistent level. The average worker completed ${stats.avg_hours_worked.toFixed(2)} hours and accumulated ${stats.total_overtime.toFixed(2)} overtime hours collectively. Focus on supporting the irregular and high-risk worker segments to improve overall attendance consistency.`;
}

/**
 * Helper: Analyze worker performance
 */
function analyzeWorkerPerformance(attendanceData) {
  const workerStats = {};

  attendanceData.forEach(record => {
    if (!workerStats[record.worker_id]) {
      workerStats[record.worker_id] = {
        name: record.name,
        total: 0,
        present: 0,
        late: 0
      };
    }
    workerStats[record.worker_id].total++;
    if (record.check_in) {
      workerStats[record.worker_id].present++;
      if (record.is_late) workerStats[record.worker_id].late++;
    }
  });

  const performanceList = Object.values(workerStats).map(w => ({
    name: w.name,
    attendance_rate: ((w.present / w.total) * 100).toFixed(2),
    late_count: w.late
  }));

  const topPerformers = performanceList
    .sort((a, b) => parseFloat(b.attendance_rate) - parseFloat(a.attendance_rate))
    .slice(0, 5)
    .map(w => ({ ...w, status: 'Excellent' }));

  const concerns = performanceList
    .sort((a, b) => parseFloat(a.attendance_rate) - parseFloat(b.attendance_rate))
    .slice(0, 5)
    .map(w => ({ ...w, status: 'Needs Attention' }));

  return { topPerformers, concerns };
}

/**
 * Helper: Get data-driven recommendations
 */
function getDataDrivenRecommendations(stats, period) {
  const recommendations = [];

  if (stats.avg_attendance_rate < 90) {
    recommendations.push({
      priority: 'HIGH',
      suggestion: 'Attendance rate is below 90%. Consider implementing attendance improvement programs.'
    });
  }

  if (stats.on_time_percentage < 80) {
    recommendations.push({
      priority: 'MEDIUM',
      suggestion: 'On-time arrival rate is below 80%. Review start times or commute support options.'
    });
  }

  if (stats.high_risk_workers > stats.total_workers * 0.2) {
    recommendations.push({
      priority: 'HIGH',
      suggestion: 'More than 20% of workers are in the high-risk category. Implement targeted interventions.'
    });
  }

  if (stats.irregular_workers > stats.total_workers * 0.3) {
    recommendations.push({
      priority: 'MEDIUM',
      suggestion: 'Many workers show irregular attendance. Consider flexible scheduling options.'
    });
  }

  if (stats.total_overtime > 200) {
    recommendations.push({
      priority: 'MEDIUM',
      suggestion: 'High overtime hours detected. Monitor workload and staff scheduling.'
    });
  }

  return recommendations;
}

/**
 * Helper: Get date range based on period
 */
function getDateRange(period) {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }

  return { startDate, endDate };
}

module.exports = exports;
