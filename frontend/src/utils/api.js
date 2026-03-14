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

// Worker API calls - new endpoints
export const searchWorkers = async (query) => {
  const response = await fetch(`${API_URL}/workers/search?q=${encodeURIComponent(query)}`);
  return response.json();
};

export const getNextWorkerId = async () => {
  const response = await fetch(`${API_URL}/workers/next-id`);
  return response.json();
};

export const updateWorker = async (id, workerData) => {
  const response = await fetch(`${API_URL}/workers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workerData)
  });
  return response.json();
};

export const deactivateWorker = async (id, reason) => {
  const response = await fetch(`${API_URL}/workers/${id}/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  return response.json();
};

export const activateWorker = async (id) => {
  const response = await fetch(`${API_URL}/workers/${id}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  return response.json();
};

// Attendance API calls - new endpoints
export const getAttendanceByDateRange = async (start, end) => {
  const response = await fetch(`${API_URL}/attendance/date-range?start=${start}&end=${end}`);
  return response.json();
};

export const getAttendanceStatistics = async (days) => {
  const response = await fetch(`${API_URL}/attendance/statistics?days=${days}`);
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
