# BlueTrack Full-Stack Backend - Technical Documentation

This document provides a comprehensive deep dive into the technical architecture, routes, database integrations, and core business engines of the BlueTrack Node.js + Express backend service.

---

## Technical Overview: How, What, and Where

### What
The backend is a high-performance REST API service built with **Node.js** and **Express.js**. It handles authentication, worker lifecycle CRUD operations, shift scheduling, real-time timezone-compliant attendance tracking, contractor-wise aggregation, auto-checkouts, notifications, and interfaces with the Generative AI and Python Machine Learning systems.

### How
* **Express routing pipelines** handle HTTP methods and decode JSON payloads.
* **Supabase JS Client** acts as the primary ORM/Database connection driver, communicating with a remote PostgreSQL database over SSL.
* **Child process spawning** seamlessly interfaces with Python to run local Random Forest classification models for predictive scheduling risks.
* **Timezone synchronization** guarantees that all timestamps are locked into the Indian Standard Time (IST) timezone (`Asia/Kolkata`) regardless of server deployment location.

### Where
All full-stack backend components are located inside the `/backend` directory of the workspace. Key paths include:
* **Application Bootstrapper**: `backend/index.js`
* **Supabase Connection Config**: `backend/config/db.js`
* **API Route Definitions**: `backend/routes/`
* **Controller Implementation Logs**: `backend/controllers/`
* **Time and Timezone Helpers**: `backend/utils/timezoneHelper.js`

---

## Directory Structure

```
backend/
├── config/
│   └── db.js                 # Supabase PostgreSQL client initialization
├── controllers/
│   ├── aiController.js       # GenAI Insights (Grok/OpenAI/Gemini integrations)
│   ├── attendanceController.js # Time-spent, Shift, Auto-checkout, and Notifications
│   ├── authController.js       # Supervisor PIN authentication
│   ├── mlController.js       # Child process Python interpreter execution
│   └── workerController.js   # Worker profiles CRUD, Deactivation, & Contractor listings
├── routes/
│   ├── aiRoutes.js           # GenAI endpoints
│   ├── attendanceRoutes.js   # Today list, statistics, and notification dismissal routes
│   ├── authRoutes.js         # Security login bindings
│   ├── mlRoutes.js           # Random forest prediction routes
│   └── workerRoutes.js       # CRUD and dynamic contractor query paths
├── utils/
│   └── timezoneHelper.js     # Asia/Kolkata timezone formatting
├── index.js                  # Main server entry & middleware registration
└── package.json              # Backend dependencies list
```

---

## Technical Architecture & API Endpoints

### 1. Main Configuration (`index.js`)
Exposes a lightweight HTTP server on port `5000` (or `process.env.PORT`). Leverages `cors()` to allow cross-origin requests from the React frontend, and uses `express.json()` middleware to parse payloads up to standard JSON sizes.

### 2. Full Endpoint Routing Map
Below is the comprehensive routing plan implemented across the routing registry:

| Method | Endpoint | Description | Payload / Query Parameters | Controller |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/login` | Authenticate supervisor by secret PIN code | `{ pin: "..." }` | `authController.js` |
| **GET** | `/api/workers` | Fetch all workers in system | `?include_inactive=true` | `workerController.js` |
| **POST** | `/api/workers` | Register a new worker with next numeric sequence | `{ worker_id, name, phone, job_type, contractor_id, contractor_name, pin }` | `workerController.js` |
| **PUT** | `/api/workers/:id` | Update worker info + push notification to worker screen | `{ name, phone, job_type, contractor_name, pin }` | `workerController.js` |
| **POST** | `/api/workers/:id/deactivate`| Deactivate/archive worker profile with custom reason | `{ reason: "..." }` | `workerController.js` |
| **POST** | `/api/workers/:id/activate` | Reactivate archived worker | *None* | `workerController.js` |
| **GET** | `/api/workers/profile/:worker_id`| Fetch detailed profile for worker login screen | *None* (Worker alphanumeric W001) | `workerController.js` |
| **GET** | `/api/contractors` | Consolidate unique active contractors dynamically | *None* | `workerController.js` |
| **GET** | `/api/attendance/today` | Fetch today's combined worker list and status counts | *None* | `attendanceController.js`|
| **POST** | `/api/attendance/mark` | Insert/update individual check-in or check-out | `{ worker_id, status, check_in, check_out, absence_reason }` | `attendanceController.js`|
| **POST** | `/api/attendance/bulk` | Bulk insert/update multiple attendance records | `{ records: [ { worker_id, status, check_in ... } ] }` | `attendanceController.js`|
| **GET** | `/api/attendance/date-range` | Fetch attendance history within explicit dates | `?start=YYYY-MM-DD&end=YYYY-MM-DD` | `attendanceController.js`|
| **GET** | `/api/attendance/statistics` | Retrieve daily attendance rates across set time window | `?days=7` | `attendanceController.js`|
| **GET** | `/api/workers/:worker_id/attendance`| Get single worker's historical presence ledger | *None* | `attendanceController.js`|
| **GET** | `/api/workers/:worker_id/notifications`| Poll unread workspace change alerts for worker | *None* | `attendanceController.js`|
| **POST** | `/api/workers/:worker_id/notifications/dismiss`| Mark all active worker notifications as read | *None* | `attendanceController.js`|
| **GET** | `/api/ml/predictions` | Run batch Random Forest models for all workers | *None* | `mlController.js` |
| **POST** | `/api/ai/generate-insights` | Run GenAI algorithms on raw attendance dataset | `{ period: "daily/weekly/monthly", contractor_id }` | `aiController.js` |

---

## Database Integration & Schema Design

Connection to the PostgreSQL Database is established via the `@supabase/supabase-js` client SDK:

```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
```

### Table Schemas

#### 1. `workers` Table
Tracks vital worker identities and metadata:
* `id`: UUID (Primary Key, Auto-generated)
* `worker_id`: Alphanumeric ID (e.g. `W001`, Unique Index)
* `worker_id_sequence`: Integer (Internal autoincrement for generating next `worker_id`)
* `name`: Text (Worker's full name)
* `phone`: Text (Optional mobile number)
* `job_type`: Text (e.g. `Construction`, `Factory`, `Packaging`)
* `pin`: Text (4-digit numeric access key, default: `1234`)
* `is_active`: Boolean (Default: `true`, deactivation archives profile)
* `deactivation_reason`: Text (Nullable reason if deactivated)
* `contractor_id`: Text (Default: `C001`)
* `contractor_name`: Text (Default: `General Contractors`)
* `created_at`: Timestamptz (Default: `NOW()`)

#### 2. `attendance` Table
Logs daily worker shifts and check-in durations:
* `id`: UUID (Primary Key, Auto-generated)
* `worker_id`: Text (Foreign Key references `workers.worker_id`)
* `date`: Date (YYYY-MM-DD in India Timezone)
* `check_in`: Text (HH:MM:SS 24-hr check-in timestamp or YYYY-MM-DD HH:MM:SS)
* `check_out`: Text (HH:MM:SS 24-hr check-out timestamp or YYYY-MM-DD HH:MM:SS)
* `status`: Text (Value restricted to: `'Present'`, `'Absent'`)
* `absence_reason`: Text (Nullable explanation of absence)
* `time_spent_seconds`: Integer (Calculated duration between check-in and check-out)
* `shift_type`: Text (Mapped automatically to: `'General'`, `'Morning'`, `'Evening'`, `'Night'`)
* `created_at`: Timestamptz (Default: `NOW()`)

#### 3. `notifications` Table
Stores worker screen alert signals:
* `id`: UUID (Primary Key)
* `worker_id`: Text (Foreign Key references `workers.worker_id`)
* `message`: Text (Alert text shown dynamically to worker)
* `type`: Text (`'check_in'`, `'check_out'`, `'profile_update'`)
* `is_read`: Boolean (Default: `false`)
* `created_at`: Timestamptz (Default: `NOW()`)

---

## Core Systems & Business Engines

### 1. Shift Tracking & Auto Shift Detection
When attendance is marked with a valid check-in time, the backend automatically intercepts the timestamp and assigns the appropriate work shift:
* **Morning Shift**: Check-ins starting between **9:00 AM** and **2:00 PM** (540 to 840 minutes from midnight).
* **Evening Shift**: Check-ins starting between **2:00 PM** and **6:00 PM** (840 to 1080 minutes).
* **Night Shift**: Check-ins starting between **7:00 PM** and **12:00 AM** (1140 to 1440 minutes).
* **General Shift**: Any check-in landing outside these specific hours.

*Implementation logic (from `attendanceController.js`):*
```javascript
const detectShiftType = (checkInTimeStr) => {
  if (!checkInTimeStr) return 'General';
  const timePart = checkInTimeStr.includes(' ') ? checkInTimeStr.split(' ')[1] : checkInTimeStr;
  const match = timePart.match(/^(\d{2}):(\d{2})/);
  if (!match) return 'General';
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes >= 540 && totalMinutes < 840) return 'Morning';
  if (totalMinutes >= 840 && totalMinutes <= 1080) return 'Evening';
  if (totalMinutes >= 1140 && totalMinutes < 1440) return 'Night';
  return 'General';
};
```

### 2. Automatic Checkout Mechanics
To prevent open-ended attendance entries, workers who remain checked in for **6.0 hours or longer** without checking out are automatically checked out by the system.
* **Mechanism**: Triggers on query request headers (e.g. `GET /api/attendance/today`, `GET /api/attendance/date-range`, and `GET /api/workers/:worker_id/attendance`).
* **Processing Flow**:
  1. Scans `attendance` table for active rows where `status = 'Present'` and `check_out IS NULL`.
  2. Parses check-in date in standard India timezone: `new Date('${record.date}T${record.check_in}+05:30')`.
  3. Compares with current Indian Standard Time: `new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))`.
  4. If difference is $\ge 6.0$ hours, updates the database row by injecting:
     * `check_out` = Check-in time + exactly 6 hours.
     * `time_spent_seconds` = `21600` (exactly 6 hours in seconds).
  5. Inserts an automated system notification warning the worker: *"You were automatically checked out from your [Shift] shift after 6 hours."*

### 3. Notification Dispatcher Hooks
To provide real-time updates on worker screens, a notification triggers whenever sensitive details change:
* **Check-in**: Inserted when a supervisor or worker logs a check-in.
* **Check-out**: Logs hours worked (e.g., *"You were checked out. Hours worked: 5.4 hrs."*).
* **Auto Checkout**: Logs a warning notification for time limit enforcement.
* **Profile Update**: Whenever a supervisor edits worker name, mobile phone number, job type, PIN code, or contractor, an array of changes is logged into a message: *"Your profile was updated by supervisor: Contractor to 'Elite Builders', PIN updated."*

### 4. Dynamic Contractor Consolidation
To solve data inconsistencies where updated worker contractor assignments were not reflected, the dashboard consolidated contractor listings on the fly:
* **Logic**: Rather than reading a static list of contractors, `GET /api/contractors` runs an dynamic scan over all active registered workers in the `workers` table, extracts the unique `contractor_id` and `contractor_name` values, and maps them to an array of choices.
* **Fallback**: Returns standard static options if no workers exist.

### 5. Timezone Consistency Helper (`utils/timezoneHelper.js`)
Standardizes timestamp generation and comparisons to match Indian Standard Time (IST):
* `getIndiaTime()`: Returns Javascript `Date` representing current IST.
* `getTodayIndia()`: Formats current day to `YYYY-MM-DD` in IST.
* `getCurrentTimeIndia()`: Returns current IST hours and minutes (`HH:MM`).
* `formatIndiaTime(str)`: Explicitly formats a database timestamp string to a standardized 24-hr `YYYY-MM-DD HH:MM:SS` format.

---

## Generative AI Workforce Analytics Module

Integrates AI with workforce statistics inside `aiController.js`:
* **Fetch Phase**: Queries attendance records inside a specified range (`daily`, `weekly`, `monthly`) matching a specified `contractor_id`.
* **Stats Consolidation**: Aggregates presence rates, late counts, overtime hours, active headcounts, and parses workers into *Regular*, *Irregular*, and *High-Risk* counts.
* **Provider Integration**: Communicates via standard HTTP post fetches with AI engines specified in environment configurations:
  * **OpenAI (GPT-3.5-Turbo)**: Queries `/v1/chat/completions` using process key.
  * **Gemini (Gemini-Pro)**: Sends prompts using standard HTTP headers to `generativelanguage.googleapis.com`.
  * **Fallback System**: In case of network errors, API limits, or empty environment variables, it activates a **data-driven fallback analytical template engine** that generates fully coherent paragraph evaluations dynamically using compiled statistical parameters.
* **Outputs**: Returns a unified JSON payload containing period stats, generated textual recommendations, worker performance tiers (Excellent, Needs Attention), and priority alerts (HIGH/MEDIUM suggestion flags).
