# 🏗️ BlueTrack - Attendance System for Blue Collar Workers

A **fast, mobile-first, fraud-proof digital attendance register** for supervisors managing daily-wage workers. Built for **construction sites, factories, delivery networks, and contract labour teams** to eliminate manual register fraud, track late arrivals, and simplify daily payment records.

## 🎯 Why BlueTrack?

| Problem | BlueTrack Solution |
|---------|-------------------|
| ✗ Manual registers get lost/forged | ✓ Digital database with timestamps |
| ✗ No check-in/check-out tracking | ✓ Precise time logging (check-in, check-out) |
| ✗ Slow paper-based process | ✓ Mark 50 workers in <2 minutes |
| ✗ No attendance reports | ✓ Real-time dashboard with stats |
| ✗ Workers claim fake attendance | ✓ Supervisor verification only |
| ✗ Complex software for fieldwork | ✓ Big buttons, high contrast, mobile-native |

## 🚀 Live Deployment

### Production Links
- **Frontend:** https://bluecollarworkers.vercel.app
- **Backend API:** https://bluetrack-api.onrender.com/api
- **Database:** Supabase PostgreSQL (Cloud-hosted)

### Demo Credentials
- **Phone:** `9999999999`
- **Password:** `admin123`

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js** 18+ installed
- Git
- Supabase account (free tier)

### 1️⃣ Clone & Install

```bash
git clone https://github.com/Ramakrishnabootla/Attendance-for-Blue-Collar-Workers.git
cd Attendance-for-Blue-Collar-Workers

# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### 2️⃣ Setup Environment Variables

**Backend (.env):**
```bash
cd backend
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
PORT=5000
EOF
```

Get credentials from [Supabase Dashboard](https://app.supabase.io):
1. Settings → API
2. Copy `URL` and `anon/public` key
3. Paste into `.env`

**Frontend (.env.local):**
```bash
cd frontend
cat > .env.local << EOF
VITE_API_URL=http://localhost:5000/api
EOF
```

### 3️⃣ Start Backend

```bash
cd backend
npm run dev
```

**Expected:**
```
🚀 BlueTrack Backend running on http://localhost:5000
```

### 4️⃣ Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

**Expected:**
```
➜  Local:   http://localhost:5050/
```

### 5️⃣ Open in Browser

Visit: **http://localhost:5050**


## 📋 Features (Production Ready)

### 🔑 Core Features
1. **Supervisor Login** - Phone + password authentication
2. **Worker Management** - Add, edit, deactivate, activate workers with auto-generated IDs
3. **Attendance Marking** ⭐ - Present/Absent buttons, auto check-in/check-out, bulk submit
4. **Dashboard Analytics** - Summary cards, charts, date-range filtering
5. **Search** - Real-time worker search across all pages
6. **Absence Reasons** - Track why workers are absent (Sick, Emergency, Leave, etc.)
7. **Time Tracking** - Auto-calculates hours worked per worker per day
8. **Historical Data** - View past attendance records, not just today
9. **Worker ID Cards** - Click worker ID to see full details in popup
10. **Responsive Design** - Mobile-first, works on all devices

### Screen 1: Supervisor Login
- Phone + password authentication
- Pre-filled demo credentials (9999999999 / admin123)
- Session stored in localStorage
- Simple, no JWT complexity

### Screen 2: Worker Management
- View all active workers in table
- **Add New Worker** - Auto-generates ID (W001, W002, etc.)
- **Edit Worker** - Modify name, phone, job type
- **Deactivate Worker** - Hide from attendance marking
- **Activate Worker** - Restore deactivated worker
- Dropdown filter by job type

### Screen 3: Attendance Marking ⭐ (MAIN)
- List all workers for today
- Two buttons per worker: **Present** (green) + **Absent** (red)
- Auto-tracks check-in and check-out times
- **"Generate ID"** button for next worker ID
- Real-time summary counters (Total / Present / Absent)
- **"Submit All"** button saves to database at once
- Search workers to find quickly

### Screen 4: Dashboard
- **Summary Cards:** Total Workers, Present Today, Absent, Attendance %
- **Charts:** Pie chart (today's data) + Bar chart (7-day trend)
- **Detailed Table:** Worker ID | Name | Check-In | Check-Out | Time Spent
- **Date Range Selector:** View historical data
- Refresh button for real-time updates

### Screen 5: Navigation
- Top navbar: **Workers | Mark Attendance | Dashboard | Logout**
- Mobile-responsive design
- High contrast colors for accessibility
- All buttons ≥48px (ADA compliant)

---

## 🗄️ Database Schema (Supabase PostgreSQL)

**Cloud-hosted PostgreSQL** on [Supabase](https://supabase.co) (free tier)

### `supervisors` table
```sql
id (SERIAL PRIMARY KEY)
phone (VARCHAR, UNIQUE) → "9999999999"
password (VARCHAR) → hashed password
name (VARCHAR)
created_at (TIMESTAMP)
```

### `workers` table
```sql
id (SERIAL PRIMARY KEY)
worker_id (VARCHAR, UNIQUE) → "W001", "W002", etc.
name (VARCHAR NOT NULL)
phone (VARCHAR, optional)
job_type (VARCHAR) → Construction, Factory, Delivery, Contract Labour, Daily Wage
is_active (BOOLEAN) → TRUE by default
deactivation_reason (VARCHAR, optional)
worker_id_sequence (INT) → Auto-increment counter
created_at (TIMESTAMP)
```

### `attendance` table
```sql
id (SERIAL PRIMARY KEY)
worker_id (VARCHAR, FOREIGN KEY)
date (DATE) → "2026-03-14"
check_in (TIME) → "09:30:00"
check_out (TIME) → "17:45:00"
status (VARCHAR) → Present, Absent
absence_reason (VARCHAR) → Sick Leave, Emergency, etc.
time_spent_seconds (INT) → Duration worked
created_at (TIMESTAMP)
UNIQUE CONSTRAINT (worker_id, date) → One record per day
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/login` | `{phone, password}` | `{success, supervisor}` |

### Workers Management
| Method | Endpoint | Query/Body | Response |
|--------|----------|-----------|----------|
| GET | `/api/workers` | `?include_inactive=true` | `{success, workers[]}` |
| GET | `/api/workers/search` | `?q=search_term` | `{success, workers[]}` |
| GET | `/api/workers/next-id` | - | `{success, next_id}` |
| POST | `/api/workers` | `{worker_id, name, phone, job_type}` | `{success, worker_id}` |
| PUT | `/api/workers/:id` | `{name, phone, job_type}` | `{success, message}` |
| POST | `/api/workers/:id/deactivate` | `{reason}` (optional) | `{success, message}` |
| POST | `/api/workers/:id/activate` | - | `{success, message}` |

### Attendance Tracking
| Method | Endpoint | Query/Body | Response |
|--------|----------|-----------|----------|
| GET | `/api/attendance/today` | - | `{success, date, summary, attendance[]}` |
| GET | `/api/attendance/date-range` | `?start=YYYY-MM-DD&end=YYYY-MM-DD` | `{success, workers[], attendance[]}` |
| GET | `/api/attendance/statistics` | `?days=7` | `{success, statistics[]}` |
| POST | `/api/attendance/mark` | `{worker_id, status, check_in, check_out, absence_reason}` | `{success, message}` |
| POST | `/api/attendance/bulk` | `{records: [{worker_id, status, check_in, check_out, absence_reason}]}` | `{success, message}` |

**Testing:**
Use Postman or `curl` to test:
```bash
# Test login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","password":"admin123"}'

# Get workers
curl http://localhost:5000/api/workers

# Get today's attendance
curl http://localhost:5000/api/attendance/today

# Search workers
curl "http://localhost:5000/api/workers/search?q=Raj"

# Get attendance statistics for last 7 days
curl "http://localhost:5000/api/attendance/statistics?days=7"
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + Vite | Fast, modern, optimal for mobile |
| **Styling** | Plain CSS + Animations | Zero dependencies, smooth UI effects |
| **Routing** | React Router v6 | Simple page navigation |
| **Backend** | Node.js + Express | Lightweight, fast, JavaScript |
| **Database** | Supabase (PostgreSQL) | Cloud-hosted, free tier, auto backups, real-time |
| **Charting** | Recharts | React-native charts for analytics |
| **Frontend Deploy** | Vercel | Auto-deploy on git push, serverless |
| **Backend Deploy** | Render | Node.js process, auto-restart, free tier |

**Backend Dependencies:**
```json
{
  "express": "HTTP server",
  "@supabase/supabase-js": "Supabase client SDK",
  "cors": "Cross-origin requests",
  "dotenv": "Environment variables",
  "nodemon": "Auto-reload in dev"
}
```

**Frontend Dependencies:**
```json
{
  "react": "UI framework",
  "react-dom": "DOM rendering",
  "react-router-dom": "Page routing",
  "recharts": "Data visualization charts",
  "vite": "Build tool"
}
```

## 📊 Screenshots

### 1. Login Screen
```
```

### 2. Worker List
```
```

### 3. Mark Attendance (Quick Mode)
```

```

### 4. Dashboard
```
```


---

## 🐛 Troubleshooting

### Issue: "Cannot reach backend API"
**Solution:** Ensure `.env.local` (frontend) has correct API URL:
```bash
# For local dev
VITE_API_URL=http://localhost:5000/api

# For production
VITE_API_URL=https://bluetrack-api.onrender.com/api
```

### Issue: "CORS policy error"
**Solution:** CORS is enabled in backend. If still failing:
1. Verify backend is running (check for `🚀 BlueTrack Backend running`)
2. Confirm frontend API_URL matches backend exactly
3. Restart frontend dev server: `npm run dev`

### Issue: "Supabase connection failed"
**Solution:** Check backend `.env` has correct credentials:
```bash
# Get from Supabase Dashboard → Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
```

Then restart backend: `npm run dev`

### Issue: "Worker ID starting from W001 when creating new worker"
**Solution:** Fix sequence in Supabase SQL Editor:
```sql
UPDATE workers SET worker_id_sequence = 1 WHERE worker_id = 'W001';
UPDATE workers SET worker_id_sequence = 2 WHERE worker_id = 'W002';
UPDATE workers SET worker_id_sequence = 3 WHERE worker_id = 'W003';
UPDATE workers SET worker_id_sequence = 4 WHERE worker_id = 'W004';
UPDATE workers SET worker_id_sequence = 5 WHERE worker_id = 'W005';
UPDATE workers SET worker_id_sequence = 6 WHERE worker_id = 'W006';
UPDATE workers SET worker_id_sequence = 7 WHERE worker_id = 'W007';
UPDATE workers SET worker_id_sequence = 8 WHERE worker_id = 'W008';
```

### Issue: "Attendance not saving to database"
**Solution:** Verify:
1. Backend is connected to Supabase (check logs for ✓ or ✗)
2. Worker exists in database: `SELECT * FROM workers WHERE worker_id = 'W001';`
3. Date format: YYYY-MM-DD (e.g., "2026-03-14")
4. Time format: HH:MM:SS (e.g., "09:30:00")

### Issue: "Port 5050 already in use"
**Solution:** Change port in `frontend/vite.config.js`:
```js
server: { port: 5051 }  // Change to any free port
```

### Issue: "npm install fails"
**Solution:** Clear cache and retry:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Frontend showing 404 not found"
**Solution:** Ensure React Router is configured. File: `frontend/src/App.jsx` should have:
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
```

---

## 📝 Development Notes

### Code Structure
```
backend/
├── config/
│   └── db.js                    # Supabase client initialization
├── controllers/
│   ├── authController.js        # Login/authentication logic
│   ├── workerController.js      # Worker CRUD + search + activate/deactivate
│   └── attendanceController.js  # Attendance marking, bulk, date range, statistics
├── routes/
│   ├── authRoutes.js           # POST /api/login
│   ├── workerRoutes.js         # GET/POST /api/workers, search, manage
│   └── attendanceRoutes.js     # GET/POST /api/attendance operations
├── utils/
│   └── timezoneHelper.js       # India timezone helpers (IST)
├── migrations/
│   ├── 01_init.sql             # Initial schema
│   ├── fix_sequence.sql        # Worker ID sequence fixes
│   └── supabase_schema.sql     # PostgreSQL schema for Supabase
├── index.js                     # Main Express server
├── package.json
└── .env                         # Supabase credentials


frontend/src/
├── pages/                       # Page Components (Each has JSX + CSS)
│   ├── LoginPage/
│   │   ├── LoginPage.jsx       # Supervisor login form
│   │   └── LoginPage.css       # Login styling
│   ├── WorkersPage/
│   │   ├── WorkersPage.jsx     # Worker list, add, edit, deactivate, activate
│   │   └── WorkersPage.css     # Workers page styling
│   ├── AttendanceMarkingPage/
│   │   ├── AttendanceMarkingPage.jsx # Mark attendance, search, bulk submit
│   │   └── AttendanceMarkingPage.css # Attendance marking styling
│   ├── DashboardPage/
│   │   ├── DashboardPage.jsx   # Dashboard with stats, date range, search
│   │   └── DashboardPage.css   # Dashboard styling
│   └── LandingPage/
│       ├── LandingPage.jsx     # Welcome page (if needed)
│       └── LandingPage.css


---

## 🤖 NEW: AI-Enhanced Attendance System (v2.0)

**Powered by Machine Learning + Generative AI**

### Version 2.0 Upgrades ✨

Your BlueTrack system now includes intelligent AI features for predictive analytics and actionable insights!

### 🧠 Features Added

#### 1. ML Worker Behavior Prediction
- **Random Forest Classifier** trained on 1000+ attendance records
- Predicts worker categories:
  - ✅ **Regular Workers** (Consistent attendance)
  - ⚠️ **Irregular Attendance** (Sporadic patterns)
  - 🔴 **High Absence Risk** (Requires intervention)
- Confidence scores for each prediction
- Batch predictions for entire workforce

**Model Performance**: 86.2% accuracy ✓

#### 2. Generative AI Insights
- **Automatic report generation** (Daily/Weekly/Monthly)
- Powered by: Grok API (X.AI), OpenAI GPT, or Google Gemini
- Provides:
  - Workforce performance summaries
  - Top performers recognition
  - Concerns identification
  - Data-driven recommendations
  - Fallback rule-based insights

#### 3. Frontend Components
- **AIInsights Component**: AI-generated insights with tabs for overview, top performers, concerns, recommendations
- **MLPredictions Component**: Worker predictions table with color-coded risk levels
- Mobile-responsive beautiful UI
- Real-time refresh functionality

### 📊 New API Endpoints

#### ML Prediction Endpoints
```
POST /api/ml/predict
  Predict worker category from raw attendance data

GET /api/ml/worker/:workerId/prediction
  Get prediction for specific worker from database

POST /api/ml/batch-predict
  Batch predict for multiple workers
```

#### AI Insights Endpoints
```
POST /api/ai/generate-insights
  Generate custom insights for workers/period

GET /api/ai/contractor/:contractorId/insights
  Get contractor-wide insights with analytics
```

### 🚀 How to Use

#### 1. Setup ML Environment
```bash
cd ML
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train_model.py
```

#### 2. Configure AI Provider (.env)
```env
# Choose one: grok (recommended), openai, gemini
AI_PROVIDER=grok
AI_API_KEY=your_api_key_here

# Get keys from:
# - Grok: https://console.x.ai
# - OpenAI: https://platform.openai.com/api-keys
# - Gemini: https://makersuite.google.com/app/apikey
```

#### 3. Integrate Components in Dashboard
```jsx
import AIInsights from '../components/AIInsights';
import MLPredictions from '../components/MLPredictions';

export default function DashboardPage() {
  return (
    <>
      {/* Existing dashboard content */}
      
      {/* Add these new components */}
      <AIInsights contractorId={selectedContractorId} period="weekly" />
      <MLPredictions contractorId={selectedContractorId} />
    </>
  );
}
```

### 📈 Model Details

**Algorithm**: Random Forest Classifier
- **Trees**: 100
- **Features**: 10 (is_late, absences_30d, attendance_rate, etc.)
- **Classes**: 3 (Regular, Irregular, High_Risk)
- **Accuracy**: 86.2% on test set

**Training Data**: 1000 synthetic records with realistic patterns

See [ML/README.md](./ML/README.md) for complete details

### 🔄 Workflow

1. **Data Collection**: Attendance records from Supabase
2. **Feature Engineering**: Calculate metrics from raw data
3. **ML Prediction**: Random Forest model predicts worker category
4. **AI Insights**: Generative AI analyzes trends and generates recommendations
5. **Dashboard Display**: Beautiful UI shows predictions and insights
6. **Action Items**: Supervisors take action based on insights

### 💡 Use Cases

- **Identify High-Risk Workers**: Focus retention efforts on workers at risk
- **Recognize Top Performers**: Reward consistent, reliable workers
- **Improve Attendance**: Address irregular patterns early
- **Data-Driven Decisions**: Make staffing decisions based on analytics
- **Automate Reports**: Let AI generate professional summaries

### ⚙️ Configuration Options

```env
# AI Provider
AI_PROVIDER=grok|openai|gemini

# Caching (optional, recommended for production)
REDIS_URL=redis://localhost:6379

# ML Model
ML_MODEL_PATH=./ML/models/random_forest_model.pkl

# Batch Size (for batch predictions)
BATCH_SIZE=100
```

### 🎯 Next Steps

1. Setup Python ML environment
2. Configure AI API key
3. Test predictions endpoint: `POST /api/ml/predict`
4. Test insights endpoint: `GET /api/ai/contractor/101/insights`
5. Integrate UI components into dashboard
6. Deploy to production

### 📚 Documentation

- [ML Module Docs](./ML/README.md)
- [Jupyter Notebook](./ML/notebooks/worker_attendance_prediction.ipynb)
- [API Endpoints](#-api-endpoints)

---

**Version**: 2.0.0  
**Last Updated**: May 2026  
**Status**: Production Ready ✅
├── components/
│   ├── Navbar.jsx              # Top navigation bar (reusable)
│   ├── SearchBar.jsx           # Search component
│   ├── SearchBar.css
│   ├── DateRangeSelector.jsx   # Date picker for historical data
│   ├── DateRangeSelector.css
│   ├── ConfirmReasonModal.jsx  # Modal for absence reason
│   ├── ConfirmReasonModal.css
│   ├── IDCardPopup.jsx         # Worker ID card popup
│   ├── IDCardPopup.css
│   └── Footer.jsx              # Footer component
├── utils/
│   ├── api.js                  # Centralized API calls (all endpoints)
│   └── timezoneHelper.js       # Timezone conversions (IST)
├── App.jsx                      # Main routing component with auth check
├── main.jsx                     # React entry point
├── index.css                    # Global styles
└── package.json
```

### Key Design Decisions

1. **Supabase (Cloud DB):** No local MySQL setup needed, real-time subscriptions, auto-backups
2. **Plain CSS:** No Tailwind/Bootstrap → smaller bundle, easier customization
3. **Bulk API:** Submit all attendance at once instead of per-worker (faster, fewer requests)
4. **Absence Reasons:** Track why workers are absent (compliance + analytics)
5. **Worker Management:** Full CRUD + activate/deactivate for worker lifecycle
6. **Search Everywhere:** Search workers on attendance, dashboard, and workers pages
7. **Date Range:** View historical data, not just today
8. **localStorage:** Simple session management, no server-side sessions
9. **IST Timezone:** All times in India timezone (configurable in timezoneHelper.js)

---

## 🎯 Use Cases

### On-Site Supervisor (8 AM)
1. Open app on site laptop/tablet
2. Search for workers needed today
3. Mark all 50 workers attendance in <2 minutes (just tap tap tap)
4. Click "Submit All" - records saved to Supabase with timestamps
5. Supervisor has digital proof for payroll, cannot be forged

### Factory Manager (End of Day)
1. Login to dashboard
2. See today's attendance summary (Present/Absent)
3. Click on absent workers to see reason (medical, leave, etc.)
4. Identify no-shows quickly
5. Adjust payments in payroll system same-day

### HR / Payroll Team (Weekly)
1. Use dashboard date range selector
2. Generate weekly attendance reports
3. Compare worker claims vs system records
4. Prevent fraud/double-billing
5. Calculate wages based on hours worked

### Worker (Self-Service Optional)
1. View own attendance history
2. See check-in/check-out times
3. Verify hours worked (future enhancement)
4. Get digital attendance certificate (future)

---

## 🏆 What Makes BlueTrack Stand Out

✓ **18 API Endpoints:** Full CRUD for workers + attendance management
✓ **5 Pages:** Login, Workers, Attendance, Dashboard, Landing
✓ **Advanced Features:** Search, date ranges, statistics, bulk operations
✓ **Mobile-First:** Works on phones, tablets, laptops (responsive design)
✓ **Cloud-Ready:** Supabase auto-scaling, Railway/Vercel deployment ready
✓ **Production Quality:** Proper error handling, validation, HTTP status codes
✓ **Real Problem:** Solves actual blue-collar worker attendance fraud
✓ **Supervisor Verified:** Workers cannot mark their own attendance (prevents fraud)
✓ **Time Tracking:** Auto-calculates hours worked per worker per day
✓ **Absence Tracking:** Records reason for absence (compliance requirement)
✓ **Historical Data:** View past attendance, not just today
✓ **Timezone Aware:** All times in IST, handles daylight saving
✓ **Searchable:** Real-time worker search on all pages
✓ **Performance:** Indexed queries, lazy loading, optimized date filters
✓ **ADA Compliant:** 48px+ tap areas, high contrast colors, keyboard accessible

---

## 🚀 Gradious V2 Vetting - Mandatory Features & Testing Guide

BlueTrack fully implements the **V2 Mandatory Full Stack Vetting Requirements** as detailed below:

### 1. Worker Registration & Login
*   **Feature**: Workers can log in using their **Worker ID** and either their **Registered Phone** or a secure **4-digit PIN**. Upon login, they access a mobile-native **Worker Dashboard** displaying today's real-time attendance status and personal history.
*   **Testing**:
    1. Log out as supervisor and select the **Worker Login** tab on the Login page.
    2. Enter Worker ID `W001` and Security PIN `1234` (or phone `9876543210`).
    3. Verify redirection to `/worker-dashboard`, displaying worker details, a "Days Present" metric card, attendance rate, total hours worked, today's marking status, and a detailed calendar log.

### 2. Shift Tracking
*   **Feature**: Enabled `shift_type` (Morning, Evening, Night, General) column in `attendance` table. Allows assigning and tracking specific shifts.
*   **Testing**:
    1. Log in as Supervisor, go to **Attendance**, and check the new **Shift** column dropdown next to status badges.
    2. Toggle a worker's status to Present, select the **Morning** shift, and submit.
    3. At the top of the marking grid, change the **All Shifts** filter to **Morning Shift** and verify that only workers marked on the Morning shift are listed.

### 3. Working Hours Calculation
*   **Feature**: Automatically calculates precise decimal hours worked per shift. In-progress shifts without a check-out display **Ongoing** in real-time.
*   **Testing**:
    1. On the supervisor **Attendance** page, toggle a worker Present (sets Check-in). The "Time Spent" column will automatically read `-`.
    2. Click **Check Out** (sets Check-out) and click **Submit All**.
    3. Go to the **Dashboard** page, and verify the hours are formatted dynamically (e.g. `8.5 hrs` or `Ongoing` if check-out is missing).

### 4. Attendance History Dashboard (Range Picker & Multi-Filters)
*   **Feature**: Implemented start/end date range picking (default: last 30 days) and multi-dimensional filtering (Filter by Shift, Filter by Worker Search).
*   **Testing**:
    1. On the **Dashboard**, click **Select Date Range** and choose a range (e.g., Yesterday to Today, or Last 30 Days).
    2. Use the **All Shifts** dropdown to filter by `Morning` or `Night` shifts.
    3. Type `Raj` in the worker search input to filter range logs. Verify the summary metrics (Total, Present, Absent, Attendance Rate, and **Total Hours Worked**) update dynamically.

### 5. Contractor-wise Attendance View (Drill-down)
*   **Feature**: Expanded the `workers` table with `contractor_id` and `contractor_name` columns. Created a **Contractors** dashboard view.
*   **Testing**:
    1. Log in as Supervisor and click **💼 Contractors** in the navigation bar.
    2. Confirm summary cards display metrics per contractor: *Total Force, Present Today, Contractor Hours, Attendance Rate*.
    3. Click **👁 View Workers** on any contractor row to load the detailed worker listing drill-down panel below.

---

## 📄 License

Open source for educational & hackathon use.

---

**BlueTrack** is designed to empower supervisors, eliminate fraud, and give daily-wage workers the respect of a digital record.

---
