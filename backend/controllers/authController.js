const { pool } = require('../config/db');

// POST /api/login - Supervisor login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password required' });
    }

    const connection = await pool.getConnection();
    const [supervisors] = await connection.execute(
      'SELECT * FROM supervisors WHERE phone = ? AND password = ?',
      [phone, password]
    );
    connection.release();

    if (supervisors.length === 0) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    const supervisor = supervisors[0];
    res.json({
      success: true,
      supervisor: {
        id: supervisor.id,
        phone: supervisor.phone,
        name: supervisor.name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login };
