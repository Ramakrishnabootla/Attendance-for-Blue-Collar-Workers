const { supabase } = require('../config/db');

// GET /api/workers - List all active workers
const getWorkers = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';

    let query = supabase
      .from('workers')
      .select('id, worker_id, name, phone, job_type, is_active');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: workers, error } = await query.order('worker_id', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      workers: workers || []
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

    // Get next worker_id_sequence
    const { data: maxSeqResult, error: maxError } = await supabase
      .from('workers')
      .select('worker_id_sequence')
      .order('worker_id_sequence', { ascending: false })
      .limit(1);

    if (maxError) throw maxError;

    const nextSeq = (maxSeqResult && maxSeqResult.length > 0 && maxSeqResult[0].worker_id_sequence)
      ? maxSeqResult[0].worker_id_sequence + 1
      : 1;

    const { data, error } = await supabase
      .from('workers')
      .insert([{
        worker_id,
        name,
        phone: phone || null,
        job_type,
        worker_id_sequence: nextSeq,
        is_active: true
      }])
      .select();

    if (error) {
      if (error.message.includes('duplicate')) {
        return res.status(400).json({ error: 'Worker ID already exists' });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Worker created',
      worker_id: data[0].id
    });
  } catch (err) {
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

    const { data: workers, error } = await supabase
      .from('workers')
      .select('id, worker_id, name, phone, job_type, is_active')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,worker_id.ilike.%${q}%,phone.ilike.%${q}%`)
      .order('worker_id', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      workers: workers || []
    });
  } catch (err) {
    console.error('Search workers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/workers/next-id - Get next worker ID
const getNextWorkerId = async (req, res) => {
  try {
    const { data: result, error } = await supabase
      .from('workers')
      .select('worker_id_sequence')
      .order('worker_id_sequence', { ascending: false })
      .limit(1);

    if (error) throw error;

    const nextNum = (result && result.length > 0 && result[0].worker_id_sequence)
      ? result[0].worker_id_sequence + 1
      : 1;
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

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (job_type !== undefined) updateData.job_type = job_type;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('workers')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
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

    const { data, error } = await supabase
      .from('workers')
      .update({
        is_active: false,
        deactivation_reason: reason || null
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
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

    const { data, error } = await supabase
      .from('workers')
      .update({
        is_active: true,
        deactivation_reason: null
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
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
