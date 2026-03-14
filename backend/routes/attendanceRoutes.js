const express = require('express');
const router = express.Router();
const {
  getTodayAttendance,
  markAttendance,
  bulkMarkAttendance,
  getAttendanceByDateRange,
  getAttendanceStatistics
} = require('../controllers/attendanceController');

// GET /api/attendance/today
router.get('/attendance/today', getTodayAttendance);

// GET /api/attendance/date-range - Get attendance for a date range
router.get('/attendance/date-range', getAttendanceByDateRange);

// GET /api/attendance/statistics - Get attendance statistics
router.get('/attendance/statistics', getAttendanceStatistics);

// POST /api/attendance/mark
router.post('/attendance/mark', markAttendance);

// POST /api/attendance/bulk
router.post('/attendance/bulk', bulkMarkAttendance);

module.exports = router;
