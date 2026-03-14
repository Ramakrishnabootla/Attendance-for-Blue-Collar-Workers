const { pool } = require('../config/db');

// GET /api/attendance/today - Get today's entire attendance list
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const connection = await pool.getConnection();

    // Get all workers
    const [workers] = await connection.execute(
      'SELECT worker_id, name, job_type FROM workers ORDER BY worker_id'
    );

    // Get today's attendance
    const [attendances] = await connection.execute(
      'SELECT worker_id, check_in, check_out, status FROM attendance WHERE date = ?',
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
      status: attendanceMap[worker.worker_id]?.status || 'Absent'
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
    const { worker_id, status, check_in, check_out } = req.body;

    if (!worker_id || !status) {
      return res.status(400).json({ error: 'worker_id and status required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const connection = await pool.getConnection();

    // Check if record exists
    const [existing] = await connection.execute(
      'SELECT id FROM attendance WHERE worker_id = ? AND date = ?',
      [worker_id, today]
    );

    if (existing.length > 0) {
      // Update existing
      await connection.execute(
        'UPDATE attendance SET status = ?, check_in = ?, check_out = ? WHERE worker_id = ? AND date = ?',
        [status, check_in || null, check_out || null, worker_id, today]
      );
    } else {
      // Insert new
      await connection.execute(
        'INSERT INTO attendance (worker_id, date, status, check_in, check_out) VALUES (?, ?, ?, ?, ?)',
        [worker_id, today, status, check_in || null, check_out || null]
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
    const { records } = req.body; // Array of {worker_id, status, check_in, check_out}

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records array required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const connection = await pool.getConnection();

    // Process each record
    for (const record of records) {
      const { worker_id, status, check_in, check_out } = record;

      const [existing] = await connection.execute(
        'SELECT id FROM attendance WHERE worker_id = ? AND date = ?',
        [worker_id, today]
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE attendance SET status = ?, check_in = ?, check_out = ? WHERE worker_id = ? AND date = ?',
          [status, check_in || null, check_out || null, worker_id, today]
        );
      } else {
        await connection.execute(
          'INSERT INTO attendance (worker_id, date, status, check_in, check_out) VALUES (?, ?, ?, ?, ?)',
          [worker_id, today, status, check_in || null, check_out || null]
        );
      }
    }

    connection.release();

    res.json({
      success: true,
      message: `${records.length} attendance records saved`
    });
  } catch (err) {
    console.error('Bulk attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getTodayAttendance, markAttendance, bulkMarkAttendance };
