const { pool } = require('../config/db');

// GET /api/workers - List all workers
const getWorkers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [workers] = await connection.execute(
      'SELECT id, worker_id, name, phone, job_type FROM workers ORDER BY worker_id'
    );
    connection.release();

    res.json({
      success: true,
      workers: workers
    });
  } catch (err) {
    console.error('Get workers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/workers - Create new worker
const createWorker = async (req, res) => {
  try {
    const { worker_id, name, phone, job_type } = req.body;

    if (!worker_id || !name || !job_type) {
      return res.status(400).json({ error: 'worker_id, name, and job_type required' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO workers (worker_id, name, phone, job_type) VALUES (?, ?, ?, ?)',
      [worker_id, name, phone || null, job_type]
    );
    connection.release();

    res.json({
      success: true,
      message: 'Worker created',
      worker_id: result.insertId
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Worker ID already exists' });
    }
    console.error('Create worker error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getWorkers, createWorker };
