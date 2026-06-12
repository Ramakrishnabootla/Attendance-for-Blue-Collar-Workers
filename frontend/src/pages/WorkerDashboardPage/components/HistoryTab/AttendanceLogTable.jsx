import React from 'react';
import { formatDateReadable, formatIndiaTimeWith12Hour } from '../../../../utils/timezoneHelper';

const AttendanceLogTable = ({ history, loading, error, formatHours }) => {
  return (
    <div className="worker-history-section card">
      <h3>📋 My Attendance Log</h3>
      {loading ? (
        <div className="spinner"></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : history.length === 0 ? (
        <p className="no-records">No past attendance logs found.</p>
      ) : (
        <div className="worker-history-list">
          {history.map((record, index) => {
            const isPresent = record.status === 'Present'
            return (
              <div className={`history-log-row ${isPresent ? 'present-row' : 'absent-row'}`} key={index}>
                <div className="log-date-col">
                  <strong>{formatDateReadable(record.date)}</strong>
                  <span className="log-shift">{record.shift_type || 'General'} Shift</span>
                </div>

                <div className="log-status-col">
                  <span className={`status-badge ${isPresent ? 'status-present' : 'status-absent'}`}>
                    {isPresent ? 'Present' : 'Absent'}
                  </span>
                </div>

                {isPresent ? (
                  <div className="log-times-col">
                    <div className="log-time-item">
                      <span>In:</span> <strong>{record.check_in ? formatIndiaTimeWith12Hour(record.check_in) : '--:--'}</strong>
                    </div>
                    <div className="log-time-item">
                      <span>Out:</span> <strong>{record.check_out ? formatIndiaTimeWith12Hour(record.check_out) : '--:--'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="log-reason-col">
                    Reason: <span>{record.absence_reason || 'N/A'}</span>
                  </div>
                )}

                <div className="log-hours-col">
                  <span className="hours-badge">
                    {formatHours(record.time_spent_seconds, record.status)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceLogTable;
