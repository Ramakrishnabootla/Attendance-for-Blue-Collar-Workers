const { supabase } = require('../config/db');
const { getTodayIndia } = require('../utils/timezoneHelper');

// GET /api/attendance/today - Get today's entire attendance list
const getTodayAttendance = async (req, res) => {
  try {
    const today = getTodayIndia();

    // Get all active workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_id, name, job_type')
      .eq('is_active', true)
      .order('worker_id', { ascending: true });

    if (workersError) throw workersError;

    // Get today's attendance with time_spent calculation
    const { data: attendances, error: attendanceError } = await supabase
      .from('attendance')
      .select('worker_id, check_in, check_out, status, absence_reason, time_spent_seconds')
      .eq('date', today);

    if (attendanceError) throw attendanceError;

    // Create attendance map for quick lookup
    const attendanceMap = {};
    (attendances || []).forEach(record => {
      attendanceMap[record.worker_id] = record;
    });

    // Merge workers with attendance
    const data = workers.map(worker => ({
      worker_id: worker.worker_id,
      name: worker.name,
      job_type: worker.job_type,
      check_in: attendanceMap[worker.worker_id]?.check_in || null,
      check_out: attendanceMap[worker.worker_id]?.check_out || null,
      status: attendanceMap[worker.worker_id]?.status || 'Absent',
      absence_reason: attendanceMap[worker.worker_id]?.absence_reason || null,
      time_spent_seconds: attendanceMap[worker.worker_id]?.time_spent_seconds || null
    }));

    // Calculate summary
    const presentCount = data.filter(d => d.status === 'Present').length;
    const absentCount = data.filter(d => d.status === 'Absent').length;

    res.json({
      success: true,
      date: today,
      summary: {
        total_workers: workers.length,
        present_today: presentCount,
        absent_today: absentCount
      },
      attendance: data
    });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/attendance/mark - Mark single attendance record
const markAttendance = async (req, res) => {
  try {
    const { worker_id, status, check_in, check_out, absence_reason } = req.body;

    if (!worker_id || !status) {
      return res.status(400).json({ error: 'worker_id and status required' });
    }

    // Validate and parse datetime strings
    let parsedCheckIn = null;
    let parsedCheckOut = null;

    if (check_in) {
      try {
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(check_in)) {
          throw new Error('Invalid check_in format');
        }
        parsedCheckIn = check_in;
      } catch (e) {
        console.error(`Invalid check_in: ${check_in}`, e.message);
        parsedCheckIn = null;
      }
    }

    if (check_out) {
      try {
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(check_out)) {
          throw new Error('Invalid check_out format');
        }
        parsedCheckOut = check_out;
      } catch (e) {
        console.error(`Invalid check_out: ${check_out}`, e.message);
        parsedCheckOut = null;
      }
    }

    const today = getTodayIndia();

    // Check if record exists
    const { data: existing, error: checkError } = await supabase
      .from('attendance')
      .select('id, check_in, check_out')
      .eq('worker_id', worker_id)
      .eq('date', today)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError; // PGRST116 = not found

    if (existing) {
      // Check if attendance is already completed
      if (existing.check_in && existing.check_out) {
        return res.status(400).json({ error: 'Attendance already completed for today. No changes allowed.' });
      }

      // Update existing record
      let updateData = {
        status,
        check_in: parsedCheckIn,
        check_out: parsedCheckOut,
        absence_reason: absence_reason || null
      };

      // Calculate time_spent_seconds if both check_in and check_out are present
      if (parsedCheckIn && parsedCheckOut) {
        const checkInDate = new Date(`${today}T${parsedCheckIn}`);
        const checkOutDate = new Date(`${today}T${parsedCheckOut}`);
        const timeSpent = Math.floor((checkOutDate - checkInDate) / 1000);
        updateData.time_spent_seconds = timeSpent;
      }

      const { error: updateError } = await supabase
        .from('attendance')
        .update(updateData)
        .eq('worker_id', worker_id)
        .eq('date', today);

      if (updateError) throw updateError;
    } else {
      // Insert new
      let insertData = {
        worker_id,
        date: today,
        status,
        check_in: parsedCheckIn,
        check_out: parsedCheckOut,
        absence_reason: absence_reason || null
      };

      // Calculate time_spent_seconds
      if (parsedCheckIn && parsedCheckOut) {
        const checkInDate = new Date(`${today}T${parsedCheckIn}`);
        const checkOutDate = new Date(`${today}T${parsedCheckOut}`);
        insertData.time_spent_seconds = Math.floor((checkOutDate - checkInDate) / 1000);
      }

      const { error: insertError } = await supabase
        .from('attendance')
        .insert([insertData]);

      if (insertError) throw insertError;
    }

    res.json({
      success: true,
      message: 'Attendance marked'
    });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// POST /api/attendance/bulk - Bulk mark attendance
const bulkMarkAttendance = async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records array required' });
    }

    const today = getTodayIndia();
    const completedRecords = [];
    const updatePromises = [];

    for (const record of records) {
      const { worker_id, status, check_in, check_out, absence_reason } = record;

      let parsedCheckIn = null;
      let parsedCheckOut = null;

      if (check_in && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(check_in)) {
        parsedCheckIn = check_in;
      }

      if (check_out && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(check_out)) {
        parsedCheckOut = check_out;
      }

      const { data: existing } = await supabase
        .from('attendance')
        .select('id, check_in, check_out')
        .eq('worker_id', worker_id)
        .eq('date', today)
        .single();

      if (existing) {
        if (existing.check_in && existing.check_out) {
          completedRecords.push(worker_id);
          continue;
        }

        let updateData = {
          status,
          check_in: parsedCheckIn,
          check_out: parsedCheckOut,
          absence_reason: absence_reason || null
        };

        if (parsedCheckIn && parsedCheckOut) {
          const checkInDate = new Date(`${today}T${parsedCheckIn}`);
          const checkOutDate = new Date(`${today}T${parsedCheckOut}`);
          updateData.time_spent_seconds = Math.floor((checkOutDate - checkInDate) / 1000);
        }

        updatePromises.push(
          supabase
            .from('attendance')
            .update(updateData)
            .eq('worker_id', worker_id)
            .eq('date', today)
        );
      } else {
        let insertData = {
          worker_id,
          date: today,
          status,
          check_in: parsedCheckIn,
          check_out: parsedCheckOut,
          absence_reason: absence_reason || null
        };

        if (parsedCheckIn && parsedCheckOut) {
          const checkInDate = new Date(`${today}T${parsedCheckIn}`);
          const checkOutDate = new Date(`${today}T${parsedCheckOut}`);
          insertData.time_spent_seconds = Math.floor((checkOutDate - checkInDate) / 1000);
        }

        updatePromises.push(
          supabase
            .from('attendance')
            .insert([insertData])
        );
      }
    }

    await Promise.all(updatePromises);

    let message = `${records.length - completedRecords.length} attendance records saved`;
    if (completedRecords.length > 0) {
      message += `. ${completedRecords.length} record(s) already completed and not updated: ${completedRecords.join(', ')}`;
    }

    res.json({
      success: true,
      message
    });
  } catch (err) {
    console.error('Bulk attendance error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// GET /api/attendance/date-range
const getAttendanceByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates required (YYYY-MM-DD)' });
    }

    // Get workers created on the start date
    const startDate = new Date(`${start}T00:00:00`).toISOString();
    const endDate = new Date(`${start}T23:59:59`).toISOString();

    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_id, name, job_type, id')
      .eq('is_active', true)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('worker_id', { ascending: true });

    if (workersError) throw workersError;

    if (!workers || workers.length === 0) {
      return res.json({
        success: true,
        start_date: start,
        end_date: end,
        workers: [],
        attendance: []
      });
    }

    const workerIds = workers.map(w => w.worker_id);

    // Get attendance records for these workers within date range
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('worker_id, date, check_in, check_out, status, absence_reason, time_spent_seconds')
      .in('worker_id', workerIds)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .order('worker_id', { ascending: true });

    if (attendanceError) throw attendanceError;

    res.json({
      success: true,
      start_date: start,
      end_date: end,
      workers: workers,
      attendance: attendance || []
    });
  } catch (err) {
    console.error('Get attendance by date range error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/attendance/statistics
const getAttendanceStatistics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    if (days < 1 || days > 365) {
      return res.status(400).json({ error: 'days must be between 1 and 365' });
    }

    // Calculate the start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data: stats, error } = await supabase
      .from('attendance')
      .select('date, status')
      .gte('date', startDateStr)
      .order('date', { ascending: false });

    if (error) throw error;

    // Process statistics on client side
    const statsMap = {};
    (stats || []).forEach(record => {
      const date = record.date;
      if (!statsMap[date]) {
        statsMap[date] = {
          date,
          total_records: 0,
          present_count: 0,
          absent_count: 0
        };
      }
      statsMap[date].total_records++;
      if (record.status === 'Present') {
        statsMap[date].present_count++;
      } else if (record.status === 'Absent') {
        statsMap[date].absent_count++;
      }
    });

    // Calculate rates
    const finalStats = Object.values(statsMap).map(stat => ({
      ...stat,
      attendance_rate: stat.total_records > 0
        ? (stat.present_count * 100 / stat.total_records).toFixed(2)
        : 0
    }));

    res.json({
      success: true,
      days: days,
      statistics: finalStats
    });
  } catch (err) {
    console.error('Get attendance statistics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getTodayAttendance,
  markAttendance,
  bulkMarkAttendance,
  getAttendanceByDateRange,
  getAttendanceStatistics
};
