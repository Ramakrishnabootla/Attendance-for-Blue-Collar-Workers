// Timezone utility for frontend (India timezone formatting)
// Formats dates and times consistently for India (Asia/Kolkata)

/**
 * Format datetime string to India timezone with 12-hour format (with AM/PM)
 * @param {string|Date} dateString - ISO datetime string or Date object
 * @returns {string} Formatted time (e.g., "09:30 AM")
 */
export const formatIndiaTimeWith12Hour = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format datetime string to India timezone with 24-hour format
 * @param {string|Date} dateString - ISO datetime string or Date object
 * @returns {string} Formatted time (e.g., "09:30")
 */
export const formatIndiaTime24 = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Get current time in India timezone (24-hour format)
 * @returns {string} Current time in HH:MM format (e.g., "14:30")
 */
export const getIndiaTimeNow24 = () => {
  const ind = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const indDate = new Date(ind);
  const hours = String(indDate.getHours()).padStart(2, '0');
  const minutes = String(indDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Get current time in India timezone (12-hour format with AM/PM)
 * @returns {string} Current time (e.g., "09:30 AM")
 */
export const getIndiaTimeNow = () => {
  const ind = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const indDate = new Date(ind);
  const hours = indDate.getHours();
  const minutes = String(indDate.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = String(hours % 12 || 12).padStart(2, '0');
  return `${displayHours}:${minutes} ${ampm}`;
};

/**
 * Convert 12-hour time string to 24-hour format
 * @param {string} time12 - Time in 12-hour format (e.g., "02:17 PM")
 * @returns {string} Time in 24-hour format (e.g., "14:17")
 */
export const convert12To24 = (time12) => {
  if (!time12) return null;
  const [time, period] = time12.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

/**
 * Convert seconds to HH:MM:SS format
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time (e.g., "01:30:45")
 */
export const formatSecondsToHHMMSS = (seconds) => {
  if (!seconds || seconds === null) return '--:--:--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Get today's date in India timezone (YYYY-MM-DD)
 * @returns {string} Today's date
 */
export const getTodayIndia = () => {
  const ind = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const indDate = new Date(ind);
  const year = indDate.getFullYear();
  const month = String(indDate.getMonth() + 1).padStart(2, '0');
  const date = String(indDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

/**
 * Format date to readable format in India timezone
 * @param {string} dateString - Date string or ISO datetime
 * @returns {string} Formatted date (e.g., "March 14, 2026")
 */
export const formatDateReadable = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
