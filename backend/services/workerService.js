const { supabase } = require('../config/db');

// GET /api/workers - List all active workers
const getWorkers = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';

    let query = supabase
      .from('workers')
      .select('id, worker_id, name, phone, job_type, is_active, contractor_id, contractor_name, pin');

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
    const { worker_id, name, phone, job_type, contractor_id, contractor_name, pin } = req.body;

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
        is_active: true,
        contractor_id: contractor_id || 'C001',
        contractor_name: contractor_name || 'General Contractors',
        pin: pin || '1234'
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
      .select('id, worker_id, name, phone, job_type, is_active, contractor_id, contractor_name, pin')
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
    const { name, phone, job_type, contractor_id, contractor_name, pin } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Worker ID required' });
    }

    // Fetch old worker data first to detect real changes
    const { data: oldWorker, error: fetchOldError } = await supabase
      .from('workers')
      .select('name, phone, job_type, contractor_name, pin, worker_id')
      .eq('id', id)
      .single();

    if (fetchOldError) {
      return res.status(444).json({ error: 'Worker not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (job_type !== undefined) updateData.job_type = job_type;
    if (contractor_id !== undefined) updateData.contractor_id = contractor_id;
    if (contractor_name !== undefined) updateData.contractor_name = contractor_name;
    if (pin !== undefined) updateData.pin = pin;

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

    // Trigger notification on change
    try {
      const worker_id = oldWorker.worker_id;

      const changes = [];
      if (name !== undefined && name !== oldWorker.name) {
        changes.push(`name from "${oldWorker.name || 'None'}" to "${name}"`);
      }
      if (phone !== undefined && phone !== oldWorker.phone) {
        changes.push(`phone from "${oldWorker.phone || 'None'}" to "${phone}"`);
      }
      if (job_type !== undefined && job_type !== oldWorker.job_type) {
        changes.push(`job type from "${oldWorker.job_type || 'None'}" to "${job_type}"`);
      }
      if (contractor_name !== undefined && contractor_name !== oldWorker.contractor_name) {
        changes.push(`contractor from "${oldWorker.contractor_name || 'None'}" to "${contractor_name}"`);
      }
      if (pin !== undefined && pin !== oldWorker.pin) {
        changes.push('login PIN updated');
      }

      if (changes.length > 0) {
        const msg = `Your profile was updated by supervisor: ${changes.join(', ')}.`;
        await supabase
          .from('notifications')
          .insert([{
            worker_id,
            message: msg,
            type: 'profile_update',
            is_read: false
          }]);
      }
    } catch (notifErr) {
      console.error('Notification log error:', notifErr);
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

// GET /api/workers/profile/:worker_id - Get worker profile by worker_id (alphanumeric W001)
const getWorkerByWorkerId = async (req, res) => {
  try {
    const { worker_id } = req.params;
    if (!worker_id) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    const { data: worker, error } = await supabase
      .from('workers')
      .select('id, worker_id, name, phone, job_type, is_active, contractor_id, contractor_name, pin, deactivation_reason, created_at')
      .eq('worker_id', worker_id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Worker profile not found' });
    }
    if (error) throw error;

    res.json({
      success: true,
      worker
    });
  } catch (err) {
    console.error('Get worker profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/contractors - List all active contractors dynamically based on registered workers
const getContractors = async (req, res) => {
  try {
    const { data: workers, error } = await supabase
      .from('workers')
      .select('contractor_id, contractor_name')
      .eq('is_active', true);

    if (error) throw error;

    // Filter unique contractors
    const contractorMap = {};
    (workers || []).forEach(w => {
      const cId = w.contractor_id || 'C001';
      const cName = w.contractor_name || 'General Contractors';
      contractorMap[cId] = cName;
    });

    const contractors = Object.keys(contractorMap).map(id => ({
      id,
      name: contractorMap[id]
    }));

    // Standard fallback contractors list if none are dynamically registered
    if (contractors.length === 0) {
      contractors.push(
        { id: 'C001', name: 'ABC Contractors' },
        { id: 'C002', name: 'XYZ Builders' },
        { id: 'C003', name: 'Global Labour Co' },
        { id: 'C004', name: 'Elite Construction' }
      );
    }

    res.json({
      success: true,
      contractors
    });
  } catch (err) {
    console.error('Get contractors error:', err);
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
  activateWorker,
  getWorkerByWorkerId,
  getContractors
};
