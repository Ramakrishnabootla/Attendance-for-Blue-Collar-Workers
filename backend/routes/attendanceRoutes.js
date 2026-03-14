const express = require('express');
const router = express.Router();
const { getTodayAttendance, markAttendance, bulkMarkAttendance } = require('../controllers/attendanceController');

// GET /api/attendance/today
router.get('/attendance/today', getTodayAttendance);

// POST /api/attendance/mark
router.post('/attendance/mark', markAttendance);

// POST /api/attendance/bulk
router.post('/attendance/bulk', bulkMarkAttendance);

module.exports = router;
