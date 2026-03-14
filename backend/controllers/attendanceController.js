const { pool } = require('../config/db');
const { getTodayIndia } = require('../utils/timezoneHelper');

// GET /api/attendance/today - Get today's entire attendance list
const getTodayAttendance = async (req, res) => {
  try {
    const today = getTodayIndia();
    const connection = await pool.getConnection();

    // Get all active workers
    const [workers] = await connection.execute(
      'SELECT worker_id, name, job_type FROM workers WHERE is_active = TRUE ORDER BY worker_id'
    );

    // Get today's attendance with time_spent calculation
    const [attendances] = await connection.execute(
      `SELECT worker_id, check_in, check_out, status, absence_reason,
              TIMESTAMPDIFF(SECOND, check_in, check_out) as time_spent_seconds
       FROM attendance WHERE date = ?`,
      [today]
    );
    connection.release();

    // Create attendance map for quick lookup
    const attendanceMap = {};
    attendances.forEach(record => {
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

    const today = getTodayIndia();
    const connection = await pool.getConnection();

    // Check if record exists
    const [existing] = await connection.execute(
      'SELECT id, check_in, check_out FROM attendance WHERE worker_id = ? AND date = ?',
      [worker_id, today]
    );

    if (existing.length > 0) {
      // Check if attendance is already completed (both check_in and check_out present)
      if (existing[0].check_in && existing[0].check_out) {
        connection.release();
        return res.status(400).json({ error: 'Attendance already completed for today. No changes allowed.' });
      }

      // Update existing
      await connection.execute(
        'UPDATE attendance SET status = ?, check_in = ?, check_out = ?, absence_reason = ? WHERE worker_id = ? AND date = ?',
        [status, check_in || null, check_out || null, absence_reason || null, worker_id, today]
      );
    } else {
      // Insert new
      await connection.execute(
        'INSERT INTO attendance (worker_id, date, status, check_in, check_out, absence_reason) VALUES (?, ?, ?, ?, ?, ?)',
        [worker_id, today, status, check_in || null, check_out || null, absence_reason || null]
      );
    }

    connection.release();

    res.json({
      success: true,
      message: 'Attendance marked'
    });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/attendance/bulk - Bulk mark attendance
const bulkMarkAttendance = async (req, res) => {
  try {
    const { records } = req.body; // Array of {worker_id, status, check_in, check_out, absence_reason}

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records array required' });
    }

    const today = getTodayIndia();
    const connection = await pool.getConnection();

    // Process each record
    const completedRecords = [];
    for (const record of records) {
      const { worker_id, status, check_in, check_out, absence_reason } = record;

      const [existing] = await connection.execute(
        'SELECT id, check_in, check_out FROM attendance WHERE worker_id = ? AND date = ?',
        [worker_id, today]
      );

      if (existing.length > 0) {
        // Check if attendance is already completed
        if (existing[0].check_in && existing[0].check_out) {
          completedRecords.push(worker_id);
          continue; // Skip updating this record
        }

        await connection.execute(
          'UPDATE attendance SET status = ?, check_in = ?, check_out = ?, absence_reason = ? WHERE worker_id = ? AND date = ?',
          [status, check_in || null, check_out || null, absence_reason || null, worker_id, today]
        );
      } else {
        await connection.execute(
          'INSERT INTO attendance (worker_id, date, status, check_in, check_out, absence_reason) VALUES (?, ?, ?, ?, ?, ?)',
          [worker_id, today, status, check_in || null, check_out || null, absence_reason || null]
        );
      }
    }

    connection.release();

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
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/attendance/date-range - Get attendance for a date range (filtered by created_at)
const getAttendanceByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates required (YYYY-MM-DD)' });
    }

    const connection = await pool.getConnection();

    // Get workers created on the start date
    const [workers] = await connection.execute(
      'SELECT worker_id, name, job_type, id FROM workers WHERE DATE(created_at) = ? AND is_active = TRUE ORDER BY worker_id',
      [start]
    );

    if (workers.length === 0) {
      connection.release();
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
    const placeholders = workerIds.map(() => '?').join(',');
    const [attendance] = await connection.execute(
      `SELECT worker_id, date, check_in, check_out, status, absence_reason,
              TIMESTAMPDIFF(SECOND, check_in, check_out) as time_spent_seconds
       FROM attendance
       WHERE worker_id IN (${placeholders}) AND date BETWEEN ? AND ?
       ORDER BY date DESC, worker_id`,
      [...workerIds, start, end]
    );
    connection.release();

    res.json({
      success: true,
      start_date: start,
      end_date: end,
      workers: workers,
      attendance: attendance
    });
  } catch (err) {
    console.error('Get attendance by date range error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/attendance/statistics - Get attendance statistics for past N days
const getAttendanceStatistics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    if (days < 1 || days > 365) {
      return res.status(400).json({ error: 'days must be between 1 and 365' });
    }

    const connection = await pool.getConnection();

    // Get statistics for past N days
    const [stats] = await connection.execute(
      `SELECT
        date,
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        ROUND(SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as attendance_rate
       FROM attendance
       WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY date
       ORDER BY date DESC`,
      [days - 1]
    );
    connection.release();

    res.json({
      success: true,
      days: days,
      statistics: stats
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
