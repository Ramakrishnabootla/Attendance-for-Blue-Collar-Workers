const { pool } = require('../config/db');

// GET /api/workers - List all active workers
const getWorkers = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const connection = await pool.getConnection();

    let query = 'SELECT id, worker_id, name, phone, job_type, is_active FROM workers';
    if (!includeInactive) {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY worker_id';

    const [workers] = await connection.execute(query);
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

    // Get next worker_id_sequence
    const [maxSeq] = await connection.execute(
      'SELECT COALESCE(MAX(worker_id_sequence), 0) + 1 as next_seq FROM workers'
    );
    const nextSeq = maxSeq[0].next_seq;

    const [result] = await connection.execute(
      'INSERT INTO workers (worker_id, name, phone, job_type, worker_id_sequence, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [worker_id, name, phone || null, job_type, nextSeq]
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

// GET /api/workers/search - Search workers by name, worker_id, or phone
const searchWorkers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const connection = await pool.getConnection();
    const searchTerm = `%${q}%`;

    const [workers] = await connection.execute(
      `SELECT id, worker_id, name, phone, job_type, is_active
       FROM workers
       WHERE is_active = TRUE AND (
         name LIKE ? OR
         worker_id LIKE ? OR
         phone LIKE ?
       )
       ORDER BY worker_id`,
      [searchTerm, searchTerm, searchTerm]
    );
    connection.release();

    res.json({
      success: true,
      workers: workers
    });
  } catch (err) {
    console.error('Search workers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/workers/next-id - Get next worker ID
const getNextWorkerId = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Get MAX from ALL workers (including inactive) to avoid ID conflicts
    const [result] = await connection.execute(
      'SELECT COALESCE(MAX(worker_id_sequence), 0) + 1 as next_seq FROM workers'
    );
    connection.release();

    const nextNum = result[0].next_seq;
    const nextId = `W${String(nextNum).padStart(3, '0')}`;

    res.json({
      success: true,
      next_id: nextId,
      next_sequence: nextNum
    });
  } catch (err) {
    console.error('Get next worker ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/workers/:id - Update worker details
const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, job_type } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Worker ID required' });
    }

    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (job_type !== undefined) {
      updates.push('job_type = ?');
      values.push(job_type);
    }

    if (updates.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE workers SET ${updates.join(', ')} WHERE id = ?`;

    const [result] = await connection.execute(query, values);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({
      success: true,
      message: 'Worker updated'
    });
  } catch (err) {
    console.error('Update worker error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/workers/:id/deactivate - Deactivate worker
const deactivateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Worker ID required' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'UPDATE workers SET is_active = FALSE, deactivation_reason = ? WHERE id = ?',
      [reason || null, id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({
      success: true,
      message: 'Worker deactivated'
    });
  } catch (err) {
    console.error('Deactivate worker error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/workers/:id/activate - Reactivate worker
const activateWorker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Worker ID required' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'UPDATE workers SET is_active = TRUE, deactivation_reason = NULL WHERE id = ?',
      [id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({
      success: true,
      message: 'Worker activated'
    });
  } catch (err) {
    console.error('Activate worker error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getWorkers,
  createWorker,
  searchWorkers,
  getNextWorkerId,
  updateWorker,
  deactivateWorker,
  activateWorker
};
