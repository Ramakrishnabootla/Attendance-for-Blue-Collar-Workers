const { supabase } = require('../config/db');
const { getTodayIndia } = require('../utils/timezoneHelper');

// Helper to automatically detect shift type based on check-in time
const detectShiftType = (checkInTimeStr) => {
  if (!checkInTimeStr) return 'General';
  
  // Format could be: "YYYY-MM-DD HH:MM:SS" or "HH:MM:SS"
  const timePart = checkInTimeStr.includes(' ') ? checkInTimeStr.split(' ')[1] : checkInTimeStr;
  const match = timePart.match(/^(\d{2}):(\d{2})/);
  if (!match) return 'General';
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const totalMinutes = hours * 60 + minutes;
  
  // Morning Shift: 9 AM to 2 PM (09:00 to 14:00) -> 540 to 840 minutes
  // Evening Shift: 2 PM to 6 PM (14:00 to 18:00) -> 840 to 1080 minutes
  // Night Shift: 7 PM to 12 AM (19:00 to 24:00) -> 1140 to 1440 minutes
  // Rest -> General Shift
  if (totalMinutes >= 540 && totalMinutes < 840) {
    return 'Morning';
  } else if (totalMinutes >= 840 && totalMinutes <= 1080) {
    return 'Evening';
  } else if (totalMinutes >= 1140 && totalMinutes < 1440) {
    return 'Night';
  } else {
    return 'General';
  }
};

// Helper to handle auto checking out workers after 6 hours
const handleAutoCheckOuts = async () => {
  try {
    const { data: activeRecords, error: activeError } = await supabase
      .from('attendance')
      .select('id, worker_id, date, check_in, status, shift_type')
      .is('check_out', null)
      .eq('status', 'Present');

    if (activeError) throw activeError;
    if (!activeRecords || activeRecords.length === 0) return;

    // Use current time in Indian Standard Time (IST)
    const nowIndia = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    for (const record of activeRecords) {
      if (!record.check_in) continue;

      // Construct check-in date object in India timezone
      const checkInDate = new Date(`${record.date}T${record.check_in}+05:30`);
      if (isNaN(checkInDate.getTime())) continue;

      const diffMs = nowIndia - checkInDate;
      const diffHours = diffMs / (1000 * 60 * 60);

      // If active for 6 or more hours, auto-checkout
      if (diffHours >= 6.0) {
        const checkOutDate = new Date(checkInDate.getTime() + 6 * 60 * 60 * 1000);
        const outHours = String(checkOutDate.getHours()).padStart(2, '0');
        const outMinutes = String(checkOutDate.getMinutes()).padStart(2, '0');
        const outSeconds = String(checkOutDate.getSeconds()).padStart(2, '0');
        const checkOutTimeStr = `${outHours}:${outMinutes}:${outSeconds}`;

        // Update attendance record with checkout time and 6 hours duration
        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            check_out: checkOutTimeStr,
            time_spent_seconds: 21600 // 6 hours
          })
          .eq('id', record.id);

        if (updateError) {
          console.error(`Error auto-checking out worker ${record.worker_id}:`, updateError);
          continue;
        }

        // Insert a checkout notification for the worker
        const shiftName = record.shift_type || 'General';
        await supabase
          .from('notifications')
          .insert([{
            worker_id: record.worker_id,
            message: `You were automatically checked out from your ${shiftName} shift after 6 hours.`,
            type: 'check_out',
            is_read: false
          }]);
      }
    }
  } catch (err) {
    console.error('Error handling auto checkouts:', err);
  }
};

// GET /api/attendance/today - Get today's entire attendance list
const getTodayAttendance = async (req, res) => {
  try {
    // Process auto check-outs first
    await handleAutoCheckOuts();

    const today = getTodayIndia();

    // Get all active workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_id, name, job_type, contractor_id, contractor_name')
      .eq('is_active', true)
      .order('worker_id', { ascending: true });

    if (workersError) throw workersError;

    // Get today's attendance records
    const { data: attendances, error: attendanceError } = await supabase
      .from('attendance')
      .select('worker_id, check_in, check_out, status, absence_reason, time_spent_seconds, shift_type')
      .eq('date', today);

    if (attendanceError) throw attendanceError;

    // Create attendance map for quick lookup
    const attendanceMap = {};
    (attendances || []).forEach(record => {
      attendanceMap[record.worker_id] = record;
    });

    // Merge workers with attendance, including contractor info
    const data = workers.map(worker => ({
      worker_id: worker.worker_id,
      name: worker.name,
      job_type: worker.job_type,
      contractor_id: worker.contractor_id || 'C001',
      contractor_name: worker.contractor_name || 'General Contractors',
      check_in: attendanceMap[worker.worker_id]?.check_in || null,
      check_out: attendanceMap[worker.worker_id]?.check_out || null,
      status: attendanceMap[worker.worker_id]?.status || 'Absent',
      absence_reason: attendanceMap[worker.worker_id]?.absence_reason || null,
      time_spent_seconds: attendanceMap[worker.worker_id]?.time_spent_seconds || null,
      shift_type: attendanceMap[worker.worker_id]?.shift_type || 'General'
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
    const { worker_id, status, check_in, check_out, absence_reason, shift_type } = req.body;

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

    // Auto-detect shift type if check_in is provided
    let finalShiftType = shift_type || 'General';
    if (parsedCheckIn) {
      finalShiftType = detectShiftType(parsedCheckIn);
    }

    // Check if record exists
    const { data: existing, error: checkError } = await supabase
      .from('attendance')
      .select('id, check_in, check_out, status, shift_type')
      .eq('worker_id', worker_id)
      .eq('date', today)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError; // PGRST116 = not found

    let isCheckingIn = false;
    let isCheckingOut = false;
    let finalHours = 0;

    if (existing) {
      // Check if attendance is already completed
      if (existing.check_in && existing.check_out) {
        return res.status(400).json({ error: 'Attendance already completed for today. No changes allowed.' });
      }

      isCheckingIn = !existing.check_in && !!parsedCheckIn;
      isCheckingOut = !existing.check_out && !!parsedCheckOut;

      // Update existing record
      let updateData = {
        status,
        check_in: parsedCheckIn,
        check_out: parsedCheckOut,
        absence_reason: absence_reason || null,
        shift_type: finalShiftType
      };

      // Calculate time_spent_seconds if both check_in and check_out are present
      if (parsedCheckIn && parsedCheckOut) {
        const checkInDate = new Date(parsedCheckIn.replace(' ', 'T'));
        const checkOutDate = new Date(parsedCheckOut.replace(' ', 'T'));
        const timeSpent = Math.floor((checkOutDate - checkInDate) / 1000);
        updateData.time_spent_seconds = timeSpent;
        finalHours = timeSpent / 3600;
      }

      const { error: updateError } = await supabase
        .from('attendance')
        .update(updateData)
        .eq('worker_id', worker_id)
        .eq('date', today);

      if (updateError) throw updateError;
    } else {
      isCheckingIn = !!parsedCheckIn;
      isCheckingOut = !!parsedCheckOut;

      // Insert new
      let insertData = {
        worker_id,
        date: today,
        status,
        check_in: parsedCheckIn,
        check_out: parsedCheckOut,
        absence_reason: absence_reason || null,
        shift_type: finalShiftType
      };

      // Calculate time_spent_seconds
      if (parsedCheckIn && parsedCheckOut) {
        const checkInDate = new Date(parsedCheckIn.replace(' ', 'T'));
        const checkOutDate = new Date(parsedCheckOut.replace(' ', 'T'));
        const timeSpent = Math.floor((checkOutDate - checkInDate) / 1000);
        insertData.time_spent_seconds = timeSpent;
        finalHours = timeSpent / 3600;
      }

      const { error: insertError } = await supabase
        .from('attendance')
        .insert([insertData]);

      if (insertError) throw insertError;
    }

    // Handle Notifications
    if (status === 'Present') {
      if (isCheckingIn) {
        await supabase.from('notifications').insert([{
          worker_id,
          message: `You were checked in for ${finalShiftType} shift.`,
          type: 'check_in',
          is_read: false
        }]);
      }
      if (isCheckingOut) {
        await supabase.from('notifications').insert([{
          worker_id,
          message: `You were checked out. Hours worked: ${finalHours.toFixed(1)} hrs.`,
          type: 'check_out',
          is_read: false
        }]);
      }
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
    const notificationsToInsert = [];

    for (const record of records) {
      const { worker_id, status, check_in, check_out, absence_reason, shift_type } = record;

      let parsedCheckIn = null;
      let parsedCheckOut = null;

      if (check_in && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(check_in)) {
        parsedCheckIn = check_in;
      }

      if (check_out && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(check_out)) {
        parsedCheckOut = check_out;
      }

      // Auto detect shift
      let finalShiftType = shift_type || 'General';
      if (parsedCheckIn) {
        finalShiftType = detectShiftType(parsedCheckIn);
      }

      const { data: existing } = await supabase
        .from('attendance')
        .select('id, check_in, check_out, status, shift_type')
        .eq('worker_id', worker_id)
        .eq('date', today)
        .single();

      let isCheckingIn = false;
      let isCheckingOut = false;
      let finalHours = 0;

      if (existing) {
        if (existing.check_in && existing.check_out) {
          completedRecords.push(worker_id);
          continue;
        }

        isCheckingIn = !existing.check_in && !!parsedCheckIn;
        isCheckingOut = !existing.check_out && !!parsedCheckOut;

        let updateData = {
          status,
          check_in: parsedCheckIn,
          check_out: parsedCheckOut,
          absence_reason: absence_reason || null,
          shift_type: finalShiftType
        };

        if (parsedCheckIn && parsedCheckOut) {
          const checkInDate = new Date(parsedCheckIn.replace(' ', 'T'));
          const checkOutDate = new Date(parsedCheckOut.replace(' ', 'T'));
          const timeSpent = Math.floor((checkOutDate - checkInDate) / 1000);
          updateData.time_spent_seconds = timeSpent;
          finalHours = timeSpent / 3600;
        }

        updatePromises.push(
          supabase
            .from('attendance')
            .update(updateData)
            .eq('worker_id', worker_id)
            .eq('date', today)
        );
      } else {
        isCheckingIn = !!parsedCheckIn;
        isCheckingOut = !!parsedCheckOut;

        let insertData = {
          worker_id,
          date: today,
          status,
          check_in: parsedCheckIn,
          check_out: parsedCheckOut,
          absence_reason: absence_reason || null,
          shift_type: finalShiftType
        };

        if (parsedCheckIn && parsedCheckOut) {
          const checkInDate = new Date(parsedCheckIn.replace(' ', 'T'));
          const checkOutDate = new Date(parsedCheckOut.replace(' ', 'T'));
          const timeSpent = Math.floor((checkOutDate - checkInDate) / 1000);
          insertData.time_spent_seconds = timeSpent;
          finalHours = timeSpent / 3600;
        }

        updatePromises.push(
          supabase
            .from('attendance')
            .insert([insertData])
        );
      }

      // Record Notification events
      if (status === 'Present') {
        if (isCheckingIn) {
          notificationsToInsert.push({
            worker_id,
            message: `You were checked in for ${finalShiftType} shift.`,
            type: 'check_in',
            is_read: false
          });
        }
        if (isCheckingOut) {
          notificationsToInsert.push({
            worker_id,
            message: `You were checked out. Hours worked: ${finalHours.toFixed(1)} hrs.`,
            type: 'check_out',
            is_read: false
          });
        }
      }
    }

    await Promise.all(updatePromises);

    // Insert Notifications
    if (notificationsToInsert.length > 0) {
      await supabase.from('notifications').insert(notificationsToInsert);
    }

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
    // Process auto check-outs first
    await handleAutoCheckOuts();

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates required (YYYY-MM-DD)' });
    }

    // Get all active workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_id, name, job_type, id, contractor_id, contractor_name')
      .eq('is_active', true)
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
      .select('worker_id, date, check_in, check_out, status, absence_reason, time_spent_seconds, shift_type')
      .in('worker_id', workerIds)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .order('worker_id', { ascending: true });

    if (attendanceError) throw attendanceError;

    // Merge workers and attendance if start === end (single date query)
    let finalAttendance = [];
    if (start === end) {
      const attendanceMap = {};
      (attendance || []).forEach(record => {
        attendanceMap[record.worker_id] = record;
      });

      finalAttendance = workers.map(worker => ({
        worker_id: worker.worker_id,
        name: worker.name,
        job_type: worker.job_type,
        contractor_id: worker.contractor_id || 'C001',
        contractor_name: worker.contractor_name || 'General Contractors',
        date: start,
        check_in: attendanceMap[worker.worker_id]?.check_in || null,
        check_out: attendanceMap[worker.worker_id]?.check_out || null,
        status: attendanceMap[worker.worker_id]?.status || 'Absent',
        absence_reason: attendanceMap[worker.worker_id]?.absence_reason || null,
        time_spent_seconds: attendanceMap[worker.worker_id]?.time_spent_seconds || null,
        shift_type: attendanceMap[worker.worker_id]?.shift_type || 'General'
      }));
    } else {
      // For multi-day range, join worker details in memory
      const workerMap = {};
      workers.forEach(w => {
        workerMap[w.worker_id] = w;
      });
      
      finalAttendance = (attendance || []).map(record => ({
        ...record,
        name: workerMap[record.worker_id]?.name || 'Unknown',
        job_type: workerMap[record.worker_id]?.job_type || 'Unknown',
        contractor_id: workerMap[record.worker_id]?.contractor_id || 'C001',
        contractor_name: workerMap[record.worker_id]?.contractor_name || 'General Contractors'
      }));
    }

    res.json({
      success: true,
      start_date: start,
      end_date: end,
      workers: workers,
      attendance: finalAttendance
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

// GET /api/workers/:worker_id/attendance - Get single worker's personal attendance history
const getWorkerAttendanceHistory = async (req, res) => {
  try {
    // Process auto check-outs first
    await handleAutoCheckOuts();

    const { worker_id } = req.params;

    if (!worker_id) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('date, check_in, check_out, status, absence_reason, time_spent_seconds, shift_type')
      .eq('worker_id', worker_id)
      .order('date', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      attendance: attendance || []
    });
  } catch (err) {
    console.error('Get worker attendance history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/workers/:worker_id/notifications
const getWorkerNotifications = async (req, res) => {
  try {
    const { worker_id } = req.params;
    if (!worker_id) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, worker_id, message, type, is_read, created_at')
      .eq('worker_id', worker_id)
      .eq('is_read', false)
      .neq('type', 'ml_prediction')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      notifications: notifications || []
    });
  } catch (err) {
    console.error('Get worker notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/workers/:worker_id/notifications/dismiss
const dismissWorkerNotifications = async (req, res) => {
  try {
    const { worker_id } = req.params;
    if (!worker_id) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('worker_id', worker_id)
      .neq('type', 'ml_prediction');

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notifications dismissed'
    });
  } catch (err) {
    console.error('Dismiss worker notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/attendance/summary/today - High level attendance summary stats for today
const getTodayAttendanceSummary = async (req, res) => {
  try {
    const today = getTodayIndia();

    // Query active workers count
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_id, contractor_id')
      .eq('is_active', true);

    if (workersError) throw workersError;

    // Query today's attendance
    const { data: attendances, error: attendanceError } = await supabase
      .from('attendance')
      .select('worker_id, status, check_in, check_out, time_spent_seconds, shift_type')
      .eq('date', today);

    if (attendanceError) throw attendanceError;

    const totalWorkers = workers ? workers.length : 0;
    const presentCount = (attendances || []).filter(a => a.status === 'Present').length;
    const absentCount = (attendances || []).filter(a => a.status === 'Absent').length;
    const ongoingCount = (attendances || []).filter(a => a.status === 'Present' && a.check_in && !a.check_out).length;
    
    const totalSeconds = (attendances || []).reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    
    // Shift-wise counts
    const shifts = { General: 0, Morning: 0, Evening: 0, Night: 0 };
    (attendances || []).forEach(a => {
      if (a.status === 'Present') {
        const sType = a.shift_type || 'General';
        shifts[sType] = (shifts[sType] || 0) + 1;
      }
    });

    res.json({
      success: true,
      date: today,
      summary: {
        total_workers: totalWorkers,
        present: presentCount,
        absent: absentCount,
        ongoing: ongoingCount,
        attendance_rate: totalWorkers > 0 ? ((presentCount / totalWorkers) * 100).toFixed(1) : "0.0",
        total_hours_worked: totalHours,
        shift_distribution: shifts
      }
    });
  } catch (err) {
    console.error('Get today attendance summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/attendance/history - Global attendance log with filtering options
const getGlobalAttendanceHistory = async (req, res) => {
  try {
    const { worker_id, status, shift_type, start_date, end_date } = req.query;

    let query = supabase
      .from('attendance')
      .select('id, worker_id, date, check_in, check_out, status, absence_reason, time_spent_seconds, shift_type, created_at')
      .order('date', { ascending: false })
      .order('worker_id', { ascending: true });

    if (worker_id) query = query.eq('worker_id', worker_id);
    if (status) query = query.eq('status', status);
    if (shift_type) query = query.eq('shift_type', shift_type);
    if (start_date) query = query.gte('date', start_date);
    if (end_date) query = query.lte('date', end_date);

    const { data: attendance, error } = await query;

    if (error) throw error;

    // Fetch active workers to join names
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_id, name, job_type, contractor_name');

    if (workersError) throw workersError;

    const workerMap = {};
    (workers || []).forEach(w => {
      workerMap[w.worker_id] = w;
    });

    // Merge names in memory
    const finalHistory = (attendance || []).map(record => ({
      ...record,
      name: workerMap[record.worker_id]?.name || 'Unknown',
      job_type: workerMap[record.worker_id]?.job_type || 'Unknown',
      contractor_name: workerMap[record.worker_id]?.contractor_name || 'General Contractors'
    }));

    res.json({
      success: true,
      count: finalHistory.length,
      history: finalHistory
    });
  } catch (err) {
    console.error('Get global attendance history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getTodayAttendance,
  markAttendance,
  bulkMarkAttendance,
  getAttendanceByDateRange,
  getAttendanceStatistics,
  getWorkerAttendanceHistory,
  getWorkerNotifications,
  dismissWorkerNotifications,
  getTodayAttendanceSummary,
  getGlobalAttendanceHistory
};
