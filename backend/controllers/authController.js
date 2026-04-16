const { supabase } = require('../config/db');

// POST /api/login - Supervisor login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password required' });
    }

    const { data, error } = await supabase
      .from('supervisors')
      .select('id, phone, name')
      .eq('phone', phone)
      .eq('password', password)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    res.json({
      success: true,
      supervisor: {
        id: data.id,
        phone: data.phone,
        name: data.name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login };
