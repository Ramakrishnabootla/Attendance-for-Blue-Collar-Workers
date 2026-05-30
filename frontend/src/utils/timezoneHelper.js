// Timezone utility for frontend (India timezone formatting)
// Formats dates and times consistently for India (Asia/Kolkata)

/**
 * Safely parse date or time strings to a Date object, defaulting to Indian Standard Time (IST) if no timezone descriptor is present.
 * Handles pure time strings (e.g. "09:30:00"), space-separated strings (e.g. "2026-05-23 09:30:00"), and full ISO strings.
 * @param {string|Date} dateStr - The date/time string or Date object
 * @returns {Date} Parsed Date object
 */
export const parseSafeDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  let formatted = String(dateStr).trim();

  // If it's a TIME-only string (e.g. "09:30:00", "9:30:00", "09:30")
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(formatted)) {
    const ind = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const indDate = new Date(ind);
    const year = indDate.getFullYear();
    const month = String(indDate.getMonth() + 1).padStart(2, '0');
    const date = String(indDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${date}`;
    formatted = `${todayStr}T${formatted}`;
  }

  // Replace space with 'T' for ISO compatibility (e.g. "2026-05-23 09:30:00" -> "2026-05-23T09:30:00")
  if (formatted.includes(' ')) {
    formatted = formatted.replace(' ', 'T');
  }

  // If it doesn't end with a timezone indicator (Z or timezone offset like +05:30), append Asia/Kolkata (+05:30) offset
  if (!/[Zz]$/.test(formatted) && !/[+-]\d{2}:?\d{2}$/.test(formatted)) {
    formatted = `${formatted}+05:30`;
  }

  return new Date(formatted);
};

/**
 * Format datetime string to India timezone with 12-hour format (with AM/PM)
 * @param {string|Date} dateString - ISO datetime string, Date object, or TIME string
 * @returns {string} Formatted time (e.g., "09:30 AM")
 */
export const formatIndiaTimeWith12Hour = (dateString) => {
  if (!dateString) return null;
  const date = parseSafeDate(dateString);
  if (!date || isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format datetime string to India timezone with 24-hour format
 * @param {string|Date} dateString - ISO datetime string, Date object, or TIME string
 * @returns {string} Formatted time (e.g., "09:30")
 */
export const formatIndiaTime24 = (dateString) => {
  if (!dateString) return null;
  const date = parseSafeDate(dateString);
  if (!date || isNaN(date.getTime())) return null;
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
  const date = parseSafeDate(dateString);
  if (!date || isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Detect shift type based on check-in time (India timezone)
 * @param {string} timeStr - Time string or datetime (e.g. "09:30 AM", "14:15")
 * @returns {string} Shift type ('Morning', 'Evening', 'Night', 'General')
 */
export const detectShiftType = (timeStr) => {
  if (!timeStr) return 'General';
  
  let normalized = timeStr.trim();
  
  // Extract time part from spaces or ISO T characters
  if (normalized.includes(' ')) {
    normalized = normalized.split(' ')[1];
  } else if (normalized.includes('T')) {
    normalized = normalized.split('T')[1];
  }
  
  let hours = 0;
  let minutes = 0;
  
  // Handle AM/PM format
  const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    hours = parseInt(ampmMatch[1], 10);
    minutes = parseInt(ampmMatch[2], 10);
    const ampm = ampmMatch[4].toUpperCase();
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
  } else {
    // Handle 24h format
    const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    } else {
      return 'General';
    }
  }
  
  const totalMinutes = hours * 60 + minutes;
  
  // Morning Shift: 9 AM to 2 PM (09:00 to 14:00) -> 540 to 840 minutes
  // Evening Shift: 2 PM to 6 PM (14:00 to 18:00) -> 840 to 1080 minutes
  // Night Shift: 7 PM to 12 AM (19:00 to 24:00) -> 1140 to 1440 minutes
  // Rest -> General
  if (totalMinutes >= 540 && totalMinutes < 840) {
    return 'Morning';
  } else if (totalMinutes >= 840 && totalMinutes <= 1080) {
    return 'Evening';
  } else if (totalMinutes >= 1140 && totalMinutes < 1440) {
    return 'Night';
  } else {
    return 'General';
  }
};
