# BlueTrack - Reorganized Folder Structure

## Current Project Organization

The BlueTrack project has been reorganized from a compressed structure into a modular, scalable architecture that separates concerns and improves maintainability.

### Backend Structure (`backend/`)

```
backend/
├── config/
│   └── db.js                    # Database connection pool configuration
├── controllers/
│   ├── authController.js        # Login/authentication logic
│   ├── workerController.js      # Worker CRUD operations
│   └── attendanceController.js  # Attendance marking & bulk operations
├── routes/
│   ├── authRoutes.js           # /api/login routes
│   ├── workerRoutes.js         # /api/workers routes
│   └── attendanceRoutes.js     # /api/attendance routes
├── index.js                     # Main Express server
├── package.json
└── .env                         # Database credentials
```

**Key Changes:**
- ✅ Extracted 300+ lines from `index.js` into organized controller files
- ✅ Each controller handles one feature (auth, workers, attendance)
- ✅ Routes are now separate and imported into main server
- ✅ Database config isolated in `config/db.js`, easily reusable
- ✅ Clean, maintainable `index.js` with just route imports

### Frontend Structure (`frontend/src/`)

```
frontend/src/
├── pages/                       # Page Components (Each has JSX + CSS)
│   ├── LoginPage/
│   │   ├── LoginPage.jsx       # Component logic
│   │   └── LoginPage.css       # Page-specific styles
│   ├── WorkersPage/
│   │   ├── WorkersPage.jsx
│   │   └── WorkersPage.css
│   ├── AttendanceMarkingPage/
│   │   ├── AttendanceMarkingPage.jsx
│   │   └── AttendanceMarkingPage.css
│   └── DashboardPage/
│       ├── DashboardPage.jsx
│       └── DashboardPage.css
├── components/
│   └── Navbar.jsx              # Top navigation bar (reusable)
├── utils/
│   └── api.js                  # Centralized API calls
├── App.jsx                      # Main routing component
├── main.jsx                     # React entry point
├── index.css                    # Global styles
└── package.json
```

**Key Changes:**
- ✅ Each page is now a folder containing `.jsx` and `.css` files
- ✅ No inline styles - all styles moved to dedicated CSS files
- ✅ Page styles organized alongside their components
- ✅ CSS files have same name as component (LoginPage.jsx + LoginPage.css)
- ✅ Reusable components (Navbar) stay in `components/`
- ✅ All API calls centralized in `utils/api.js`
- ✅ App.jsx now clean with proper imports

### API Utilities

**`frontend/src/utils/api.js`** provides centralized API functions:
```javascript
// Auth
loginSupervisor(phone, password)

// Workers
fetchWorkers()
createWorker(workerData)

// Attendance
fetchTodayAttendance()
markAttendance(attendanceData)
bulkMarkAttendance(records)
```

### Benefits of This Structure

1. **Scalability** - Easy to add new features without cluttering main files
2. **Maintainability** - Each file has a single responsibility
3. **Reusability** - Controllers and utilities can be easily imported elsewhere
4. **Testing** - Isolated functions are easier to unit test
5. **Onboarding** - New developers can quickly understand the project
6. **Separation of Concerns** - Backend business logic separate from routes, styles separate from components

### Running the Application

Backend:
```bash
cd backend
npm install
npm run dev        # Runs on port 5000
```

Frontend:
```bash
cd frontend
npm install
npm run dev        # Runs on port 5050
```

Database:
```bash
mysql -u root -p < setup.sql   # Initialize database
```

### API Endpoints (6 total)

| Method | Endpoint | Controller | Purpose |
|--------|----------|-----------|---------|
| POST | /api/login | authController | Supervisor authentication |
| GET | /api/workers | workerController | List all workers |
| POST | /api/workers | workerController | Add new worker |
| GET | /api/attendance/today | attendanceController | Get today's attendance |
| POST | /api/attendance/mark | attendanceController | Mark single attendance |
| POST | /api/attendance/bulk | attendanceController | Bulk submit attendance |

### Frontend Routes

| Path | Component JSX | Component CSS | Purpose |
|------|-----------|-----------|---------|
| /login | LoginPage/LoginPage.jsx | LoginPage/LoginPage.css | Supervisor login |
| /workers | WorkersPage/WorkersPage.jsx | WorkersPage/WorkersPage.css | View & manage workers |
| /marking | AttendanceMarkingPage/AttendanceMarkingPage.jsx | AttendanceMarkingPage/AttendanceMarkingPage.css | Mark daily attendance |
| /dashboard | DashboardPage/DashboardPage.jsx | DashboardPage/DashboardPage.css | View attendance summary |

---

**Reorganization Complete!** 🎉 The codebase is now fully modularized, more organized, maintainable, and ready for scaling.
