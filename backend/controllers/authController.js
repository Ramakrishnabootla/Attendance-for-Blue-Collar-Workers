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

// POST /api/worker-login - Worker Login
const workerLogin = async (req, res) => {
  try {
    const { worker_id, phone, pin } = req.body;

    if (!worker_id) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    if (!phone && !pin) {
      return res.status(400).json({ error: 'Phone or PIN is required' });
    }

    // Get active worker matching worker_id
    const { data: workers, error } = await supabase
      .from('workers')
      .select('id, worker_id, name, phone, pin, job_type, contractor_id, contractor_name, is_active')
      .eq('worker_id', worker_id.trim())
      .eq('is_active', true);

    if (error) throw error;

    if (!workers || workers.length === 0) {
      return res.status(401).json({ error: 'Worker ID not found or account deactivated' });
    }

    const worker = workers[0];

    // Validate credentials: check phone or pin match
    let isValid = false;
    if (phone && worker.phone && worker.phone.trim() === phone.trim()) {
      isValid = true;
    } else if (pin && worker.pin && worker.pin.trim() === pin.trim()) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid phone number or PIN for this Worker ID' });
    }

    res.json({
      success: true,
      worker: {
        id: worker.id,
        worker_id: worker.worker_id,
        name: worker.name,
        phone: worker.phone,
        job_type: worker.job_type,
        contractor_id: worker.contractor_id || 'C001',
        contractor_name: worker.contractor_name || 'General Contractors'
      }
    });
  } catch (err) {
    console.error('Worker login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login, workerLogin };
