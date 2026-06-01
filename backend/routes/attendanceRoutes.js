const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/attendanceController');

// GET /api/attendance/today
router.get('/attendance/today', getTodayAttendance);

// GET /api/attendance/summary/today - High level attendance summary stats for today
router.get('/attendance/summary/today', getTodayAttendanceSummary);

// GET /api/attendance/history - Global attendance log with filtering options
router.get('/attendance/history', getGlobalAttendanceHistory);

// GET /api/attendance/date-range - Get attendance for a date range
router.get('/attendance/date-range', getAttendanceByDateRange);

// GET /api/attendance/statistics - Get attendance statistics
router.get('/attendance/statistics', getAttendanceStatistics);

// GET /api/workers/:worker_id/attendance - Get attendance history for a specific worker
router.get('/workers/:worker_id/attendance', getWorkerAttendanceHistory);

// GET /api/workers/:worker_id/notifications - Get unread notifications for a specific worker
router.get('/workers/:worker_id/notifications', getWorkerNotifications);

// POST /api/workers/:worker_id/notifications/dismiss - Dismiss all notifications for a specific worker
router.post('/workers/:worker_id/notifications/dismiss', dismissWorkerNotifications);

// POST /api/attendance/mark
router.post('/attendance/mark', markAttendance);

// POST /api/attendance/bulk
router.post('/attendance/bulk', bulkMarkAttendance);

module.exports = router;
