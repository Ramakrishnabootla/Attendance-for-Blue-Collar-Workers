import React from 'react';
import { formatDateReadable, formatIndiaTimeWith12Hour } from '../../../../utils/timezoneHelper';

const TodayStatusWidget = ({ todayDateStr, todayRecord, formatHours }) => {
  return (
    <div className="today-status-card card">
      <h3>📅 Today's Status ({formatDateReadable(todayDateStr)})</h3>
      {todayRecord ? (
        <div className="today-status-details">
          <div className="status-badge-row">
            <span className={`status-badge ${todayRecord.status === 'Present' ? 'status-present' : 'status-absent'}`}>
              {todayRecord.status === 'Present' ? '✓ Present' : '✗ Absent'}
            </span>
            {todayRecord.status === 'Present' && (
              <span className="shift-badge">{todayRecord.shift_type || 'General'} Shift</span>
            )}
          </div>

          {todayRecord.status === 'Present' ? (
            <div className="today-times-grid">
              <div className="time-box">
                <span className="time-label">Check-In</span>
                <span className="time-val">{todayRecord.check_in ? formatIndiaTimeWith12Hour(todayRecord.check_in) : '--:--'}</span>
              </div>
              <div className="time-box">
                <span className="time-label">Check-Out</span>
                <span className="time-val">{todayRecord.check_out ? formatIndiaTimeWith12Hour(todayRecord.check_out) : '--:--'}</span>
              </div>
              <div className="time-box">
                <span className="time-label">Hours Worked</span>
                <span className="time-val hours-val">{formatHours(todayRecord.time_spent_seconds, todayRecord.status)}</span>
              </div>
            </div>
          ) : (
            <p className="absent-reason-msg">
              Reason for Absence: <strong>{todayRecord.absence_reason || 'Not specified'}</strong>
            </p>
          )}
        </div>
      ) : (
        <p className="no-status-yet">⏳ Your attendance has not been marked by the supervisor yet today.</p>
      )}
    </div>
  );
};

export default TodayStatusWidget;
