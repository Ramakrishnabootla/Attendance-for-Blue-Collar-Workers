// Timezone utility for India (Asia/Kolkata)
// Handles all datetime conversions to ensure consistency across the app

/**
 * Get current time in India timezone
 * @returns {Date} Current date/time in India timezone
 */
const getIndiaTime = () => {
  const ind = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(ind);
};

/**
 * Get today's date in India timezone (YYYY-MM-DD format)
 * @returns {string} Today's date in YYYY-MM-DD format in India timezone
 */
const getTodayIndia = () => {
  const today = getIndiaTime();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

/**
 * Format any date/time string to India timezone
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted datetime in 24-hour format (HH:MM:SS)
 */
const formatIndiaTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Get current time in HH:MM format (24-hour, India timezone)
 * @returns {string} Current time in HH:MM format
 */
const getCurrentTimeIndia = () => {
  const now = getIndiaTime();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

module.exports = {
  getIndiaTime,
  getTodayIndia,
  formatIndiaTime,
  getCurrentTimeIndia
};
