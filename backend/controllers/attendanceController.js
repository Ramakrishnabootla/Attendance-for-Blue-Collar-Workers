const attendanceService = require('../services/attendanceService');

const getTodayAttendance = async (req, res) => {
  return await attendanceService.getTodayAttendance(req, res);
};

const markAttendance = async (req, res) => {
  return await attendanceService.markAttendance(req, res);
};

const bulkMarkAttendance = async (req, res) => {
  return await attendanceService.bulkMarkAttendance(req, res);
};

const getAttendanceByDateRange = async (req, res) => {
  return await attendanceService.getAttendanceByDateRange(req, res);
};

const getAttendanceStatistics = async (req, res) => {
  return await attendanceService.getAttendanceStatistics(req, res);
};

const getWorkerAttendanceHistory = async (req, res) => {
  return await attendanceService.getWorkerAttendanceHistory(req, res);
};

const getWorkerNotifications = async (req, res) => {
  return await attendanceService.getWorkerNotifications(req, res);
};

const dismissWorkerNotifications = async (req, res) => {
  return await attendanceService.dismissWorkerNotifications(req, res);
};

const getTodayAttendanceSummary = async (req, res) => {
  return await attendanceService.getTodayAttendanceSummary(req, res);
};

const getGlobalAttendanceHistory = async (req, res) => {
  return await attendanceService.getGlobalAttendanceHistory(req, res);
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
