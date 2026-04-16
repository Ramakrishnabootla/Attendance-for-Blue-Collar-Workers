# 🚀 BlueTrack Migration: Railway (MySQL) → Supabase (PostgreSQL)

## Phase 1: Supabase Setup (10 minutes)

### Step 1: Create Supabase Account & Project
1. Go to https://supabase.io
2. Sign up with email (or GitHub)
3. Click "New Project"
4. Fill in:
   - **Project Name:** bluetrack-db (or any name)
   - **Database Password:** Create strong password (save it!)
   - **Region:** Choose closest to your location (likely Asia)
5. Wait 1-2 minutes for database to initialize

### Step 2: Get Connection Details
1. In Supabase dashboard → Settings → Database
2. **Copy these values to a safe place:**
   - `Host` (e.g., **db.xxxxx.supabase.co**)
   - `Port` (usually **5432**)
   - `User` (usually **postgres**)
   - `Password` (what you created)
   - `Database` (usually **postgres**)
3. Also copy the **"URI"** string (full connection string)

---

## Phase 2: Create PostgreSQL Schema (10 minutes)

### Step 3: Create Tables in Supabase
1. In Supabase dashboard → SQL Editor
2. Click **"New Query"**
3. **Copy-paste this entire schema** (replaces MySQL schema):

```sql
-- BlueTrack PostgreSQL Schema (for Supabase)

-- Drop existing tables if needed (only if re-creating)
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS workers CASCADE;
-- DROP TABLE IF EXISTS supervisors CASCADE;

-- Create supervisors table
CREATE TABLE IF NOT EXISTS supervisors (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  job_type VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  deactivation_reason VARCHAR(255),
  worker_id_sequence INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status VARCHAR(50),
  absence_reason VARCHAR(255),
  time_spent_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (worker_id) REFERENCES workers(worker_id),
  UNIQUE (worker_id, date)
);

-- Insert demo supervisor
INSERT INTO supervisors (phone, password, name)
VALUES ('9999999999', 'admin123', 'Demo Supervisor')
ON CONFLICT (phone) DO UPDATE SET name = 'Demo Supervisor';

-- Insert demo workers
INSERT INTO workers (worker_id, name, phone, job_type, is_active) VALUES
('W001', 'Raj Kumar', '9876543210', 'Construction', TRUE),
('W002', 'Priya Singh', '9876543211', 'Factory', TRUE),
('W003', 'Vikram Patel', '9876543212', 'Delivery', TRUE),
('W004', 'Anita Sharma', '9876543213', 'Construction', TRUE),
('W005', 'Rohan Gupta', '9876543214', 'Contract Labour', TRUE),
('W006', 'Neha Verma', '9876543215', 'Daily Wage', TRUE),
('W007', 'Amit Kumar', '9876543216', 'Factory', TRUE),
('W008', 'Pooja Desai', '9876543217', 'Delivery', TRUE)
ON CONFLICT (worker_id) DO UPDATE SET name = EXCLUDED.name;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workers_job_type ON workers(job_type);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_date ON attendance(worker_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
```

4. Click **"Run"** button
5. Wait for success message ✅

---

## Phase 3: Update Backend Code (15 minutes)

### Step 4: Update package.json
**Replace MySQL with Supabase dependencies:**

**File:** `backend/package.json`

```json
{
  "name": "bluetrack-backend",
  "version": "1.0.0",
  "description": "BlueTrack Attendance System - Backend",
  "main": "index.js",
  "engines": {
    "node": "18.x"
  },
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "keywords": ["attendance", "workers", "backend"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "@supabase/supabase-js": "^2.38.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Step 5: Update backend/config/db.js
**New file content using Supabase:**

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Read credentials from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY not set in .env');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`📊 Connected to Supabase: ${supabaseUrl}`);

module.exports = { supabase };
```

### Step 6: Update backend .env
**File:** `backend/.env`

Replace old Railway variables with Supabase:

```
PORT=5000

# Supabase Connection (from Supabase dashboard Settings > Database)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Frontend origin for CORS
FRONTEND_URL=http://localhost:5050
```

### Step 7: Update Controllers - Part 1 (authController.js)

**File:** `backend/controllers/authController.js`

```javascript
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
```

### Step 8: Update Controllers - Part 2 (attendanceController.js)

**File:** `backend/controllers/attendanceController.js`

Key changes:
- Replace `pool.getConnection()` with `supabase` calls
- MySQL functions → PostgreSQL equivalents:
  - `TIMESTAMPDIFF(SECOND, a, b)` → `EXTRACT(EPOCH FROM (b - a))::INTEGER`
  - `DATE_SUB(CURDATE(), INTERVAL x DAY)` → `CURRENT_DATE - INTERVAL '${days} days'`
  - `CURDATE()` → `CURRENT_DATE`

```javascript
const { supabase } = require('../config/db');
const { getTodayIndia } = require('../utils/timezoneHelper');

// GET /api/attendance/today - Get today's entire attendance list
const getTodayAttendance = async (req, res) => {
  try {
    const today = getTodayIndia();

    // Get all active workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_id, name, job_type')
      .eq('is_active', true)
      .order('worker_id', { ascending: true });

    if (workersError) throw workersError;

    // Get today's attendance with time_spent calculation
    const { data: attendances, error: attendanceError } = await supabase
      .from('attendance')
      .select('worker_id, check_in, check_out, status, absence_reason, time_spent_seconds')
      .eq('date', today);

    if (attendanceError) throw attendanceError;

    // Create attendance map for quick lookup
    const attendanceMap = {};
    (attendances || []).forEach(record => {
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

    // Check if record exists
    const { data: existing, error: checkError } = await supabase
      .from('attendance')
      .select('id, check_in, check_out')
      .eq('worker_id', worker_id)
      .eq('date', today)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError; // PGRST116 = not found

    if (existing) {
      // Check if attendance is already completed
      if (existing.check_in && existing.check_out) {
        return res.status(400).json({ error: 'Attendance already completed for today. No changes allowed.' });
      }

      // Update existing record
      let updateData = {
        status,
        check_in: parsedCheckIn,
        check_out: parsedCheckOut,
        absence_reason: absence_reason || null
      };

      // Calculate time_spent_seconds if both check_in and check_out are present
      if (parsedCheckIn && parsedCheckOut) {
        // We'll calculate it using raw SQL since Supabase doesn't have direct EXTRACT in update
        const { error: updateError } = await supabase.rpc('calculate_time_spent', {
          p_worker_id: worker_id,
          p_today: today,
          p_check_in: parsedCheckIn,
          p_check_out: parsedCheckOut,
          p_status: status,
          p_absence_reason: absence_reason || null
        });
        
        if (updateError) {
          // Fallback: manual calculation
          const checkInDate = new Date(`${today} ${parsedCheckIn}`);
          const checkOutDate = new Date(`${today} ${parsedCheckOut}`);
          const timeSpent = Math.floor((checkOutDate - checkInDate) / 1000);
          updateData.time_spent_seconds = timeSpent;
          
          const { error } = await supabase
            .from('attendance')
            .update(updateData)
            .eq('worker_id', worker_id)
            .eq('date', today);
          
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from('attendance')
          .update(updateData)
          .eq('worker_id', worker_id)
          .eq('date', today);
        
        if (error) throw error;
      }
    } else {
      // Insert new
      let insertData = {
        worker_id,
        date: today,
        status,
        check_in: parsedCheckIn,
        check_out: parsedCheckOut,
        absence_reason: absence_reason || null
      };

      // Calculate time_spent_seconds
      if (parsedCheckIn && parsedCheckOut) {
        const checkInDate = new Date(`${today} ${parsedCheckIn}`);
        const checkOutDate = new Date(`${today} ${parsedCheckOut}`);
        insertData.time_spent_seconds = Math.floor((checkOutDate - checkInDate) / 1000);
      }

      const { error } = await supabase
        .from('attendance')
        .insert([insertData]);

      if (error) throw error;
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

    for (const record of records) {
      const { worker_id, status, check_in, check_out, absence_reason } = record;

      let parsedCheckIn = null;
      let parsedCheckOut = null;

      if (check_in && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(check_in)) {
        parsedCheckIn = check_in;
      }

      if (check_out && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(check_out)) {
        parsedCheckOut = check_out;
      }

      const { data: existing } = await supabase
        .from('attendance')
        .select('id, check_in, check_out')
        .eq('worker_id', worker_id)
        .eq('date', today)
        .single();

      if (existing) {
        if (existing.check_in && existing.check_out) {
          completedRecords.push(worker_id);
          continue;
        }

        let updateData = {
          status,
          check_in: parsedCheckIn,
          check_out: parsedCheckOut,
          absence_reason: absence_reason || null
        };

        if (parsedCheckIn && parsedCheckOut) {
          const checkInDate = new Date(`${today} ${parsedCheckIn}`);
          const checkOutDate = new Date(`${today} ${parsedCheckOut}`);
          updateData.time_spent_seconds = Math.floor((checkOutDate - checkInDate) / 1000);
        }

        updatePromises.push(
          supabase
            .from('attendance')
            .update(updateData)
            .eq('worker_id', worker_id)
            .eq('date', today)
        );
      } else {
        let insertData = {
          worker_id,
          date: today,
          status,
          check_in: parsedCheckIn,
          check_out: parsedCheckOut,
          absence_reason: absence_reason || null
        };

        if (parsedCheckIn && parsedCheckOut) {
          const checkInDate = new Date(`${today} ${parsedCheckIn}`);
          const checkOutDate = new Date(`${today} ${parsedCheckOut}`);
          insertData.time_spent_seconds = Math.floor((checkOutDate - checkInDate) / 1000);
        }

        updatePromises.push(
          supabase
            .from('attendance')
            .insert([insertData])
        );
      }
    }

    await Promise.all(updatePromises);

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
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end dates required (YYYY-MM-DD)' });
    }

    // Get workers created on the start date
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('worker_id, name, job_type, id')
      .eq('is_active', true)
      .gte('created_at', `${start}T00:00:00`)
      .lt('created_at', `${start}T23:59:59`)
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
      .select('worker_id, date, check_in, check_out, status, absence_reason, time_spent_seconds')
      .in('worker_id', workerIds)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .order('worker_id', { ascending: true });

    if (attendanceError) throw attendanceError;

    res.json({
      success: true,
      start_date: start,
      end_date: end,
      workers: workers,
      attendance: attendance || []
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

    const { data: stats, error } = await supabase
      .from('attendance')
      .select(`
        date,
        id
      `)
      .gte('date', new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0])
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

module.exports = {
  getTodayAttendance,
  markAttendance,
  bulkMarkAttendance,
  getAttendanceByDateRange,
  getAttendanceStatistics
};
```

### Step 9: Update Controllers - Part 3 (workerController.js)

**File:** `backend/controllers/workerController.js`

Similar changes - replace MySQL calls with Supabase:

```javascript
const { supabase } = require('../config/db');

// GET /api/workers
const getWorkers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('is_active', true)
      .order('worker_id', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      workers: data || []
    });
  } catch (err) {
    console.error('Get workers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/workers
const addWorker = async (req, res) => {
  try {
    const { worker_id, name, phone, job_type } = req.body;

    if (!worker_id || !name) {
      return res.status(400).json({ error: 'worker_id and name required' });
    }

    const { data, error } = await supabase
      .from('workers')
      .insert([{
        worker_id,
        name,
        phone: phone || null,
        job_type: job_type || null,
        is_active: true
      }])
      .select();

    if (error) throw error;

    res.json({
      success: true,
      worker: data[0]
    });
  } catch (err) {
    console.error('Add worker error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/workers/search?q=keyword
const searchWorkers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .or(`name.ilike.%${q}%,worker_id.ilike.%${q}%,phone.ilike.%${q}%`)
      .eq('is_active', true)
      .order('worker_id', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      workers: data || []
    });
  } catch (err) {
    console.error('Search workers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/workers/next-id
const getNextWorkerId = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('worker_id')
      .order('id', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextId = 'W001';
    if (data && data.length > 0) {
      const lastId = data[0].worker_id;
      const num = parseInt(lastId.substring(1)) + 1;
      nextId = `W${String(num).padStart(3, '0')}`;
    }

    res.json({
      success: true,
      next_id: nextId
    });
  } catch (err) {
    console.error('Get next ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/workers/:id
const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, job_type } = req.body;

    const { data, error } = await supabase
      .from('workers')
      .update({
        name: name || undefined,
        phone: phone || undefined,
        job_type: job_type || undefined
      })
      .eq('worker_id', id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      worker: data[0]
    });
  } catch (err) {
    console.error('Update worker error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/workers/:id/deactivate
const deactivateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('workers')
      .update({
        is_active: false,
        deactivation_reason: reason || null
      })
      .eq('worker_id', id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      worker: data[0]
    });
  } catch (err) {
    console.error('Deactivate worker error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/workers/:id/activate
const activateWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('workers')
      .update({ is_active: true })
      .eq('worker_id', id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      worker: data[0]
    });
  } catch (err) {
    console.error('Activate worker error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getWorkers,
  addWorker,
  searchWorkers,
  getNextWorkerId,
  updateWorker,
  deactivateWorker,
  activateWorker
};
```

---

## Phase 4: Test Locally (10 minutes)

### Step 10: Install Dependencies & Test
```bash
cd backend
npm install
npm run dev
```

### Step 11: Test API endpoints locally
- Go to http://localhost:5000/api/health
- Should see: `{"status":"Backend running ✓"}`

---

## Phase 5: Deploy Backend to Supabase (20 minutes)

### Option A: Deploy to Supabase via GitHub (Recommended)

1. Push your code to GitHub
2. In Supabase → Deployments → Deploy
3. Connect GitHub repo
4. Supabase will auto-deploy on push

### Option B: Deploy via Vercel (for Node.js backend)

Actually, Supabase manages PostgreSQL only. For Node.js backend, use:
- **Railway** (free tier still available for $5 credits/month)
- **Render.com** (free tier)
- **Heroku** (paid)
- **Fly.io** (free tier)

For this guide, let's use **Render.com** (easier than Supabase for Node.js):

**To Deploy to Render:**
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Fill in:
   - **Name:** bluetrack-api
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `node index.js`
6. Environment variables (copy from your `.env`):
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `NODE_ENV=production`
7. Click "Create Web Service"
8. Wait 2-3 minutes for deployment
9. Copy the URL (e.g., `https://bluetrack-api.onrender.com`)

---

## Phase 6: Update Frontend (5 minutes)

### Step 12: Update Frontend API URL

**File:** `frontend/.env.production`

```
VITE_API_URL=https://bluetrack-api.onrender.com/api
```

(Replace with your actual Render URL)

---

## Phase 7: Deploy Frontend to Vercel (Already done!)

You're already using Vercel, so just:
```bash
git add .
git commit -m "migrate: Railway (MySQL) to Supabase (PostgreSQL)"
git push origin main
```

Vercel will auto-deploy! ✅

---

##Summary of Changes

| **Component** | **Old** | **New** |
|---|---|---|
| **Database** | MySQL (Railway) | PostgreSQL (Supabase) |
| **Driver** | `mysql2` | `@supabase/supabase-js` |
| **Backend URL** | workers-rk.up.railway.app | bluetrack-api.onrender.com |
| **Frontend** | Vercel (no change) | Vercel (no change) |
| **Config File** | db.js (mysql pool) | db.js (Supabase client) |

---

## Troubleshooting

### Issue: "SUPABASE_URL not set"
→ Check `backend/.env` has both `SUPABASE_URL` and `SUPABASE_KEY`

### Issue: "Database connection error"
→ Verify credentials in Supabase dashboard Settings > Database

### Issue: "Login failed"
→ Run the SQL schema again (Step 3)

### Issue: "Frontend can't reach API"
→ Check `frontend/.env.production` has correct `VITE_API_URL`

---

✅ **You're done!** Your BlueTrack app is now running on Supabase!
