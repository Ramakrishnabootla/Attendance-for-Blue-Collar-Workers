const API_URL = 'http://localhost:5000/api';

// Auth API calls
export const loginSupervisor = async (phone, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  return response.json();
};

// Worker API calls
export const fetchWorkers = async () => {
  const response = await fetch(`${API_URL}/workers`);
  return response.json();
};

export const createWorker = async (workerData) => {
  const response = await fetch(`${API_URL}/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workerData)
  });
  return response.json();
};

// Attendance API calls
export const fetchTodayAttendance = async () => {
  const response = await fetch(`${API_URL}/attendance/today`);
  return response.json();
};

export const markAttendance = async (attendanceData) => {
  const response = await fetch(`${API_URL}/attendance/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attendanceData)
  });
  return response.json();
};

export const bulkMarkAttendance = async (records) => {
  const response = await fetch(`${API_URL}/attendance/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records })
  });
  return response.json();
};
