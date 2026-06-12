import React from 'react';
import { formatIndiaTimeWith12Hour } from '../../../../utils/timezoneHelper';

const AttendanceTable = ({
  isFilteredDate,
  activeRecords,
  dateLoading,
  formatHoursDecimal
}) => {
  return (
    <>
      <h2 className="dashboard-attendance-header">
        {isFilteredDate ? 'Historical Attendance Details' : "Today's Attendance Details"}
      </h2>

      {activeRecords.length === 0 ? (
        <p className="no-records">No attendance records found matching the filters.</p>
      ) : (
        <div className="dashboard-table-wrapper" style={{ position: 'relative', opacity: dateLoading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
          {dateLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
          )}
          <table className="dashboard-table">
            <thead>
              <tr>
                {isFilteredDate && <th>Date</th>}
                <th>Worker ID</th>
                <th>Name</th>
                <th>Job Type</th>
                <th>Shift</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Hours Worked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeRecords.map((record, idx) => (
                <tr key={idx}>
                  {isFilteredDate && <td><strong>{record.date}</strong></td>}
                  <td><strong className="dashboard-worker-id">{record.worker_id}</strong></td>
                  <td>{record.name}</td>
                  <td>{record.job_type}</td>
                  <td><span className="shift-pill" style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: 'var(--bg-lighter)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>{record.shift_type || 'General'}</span></td>
                  <td>
                    {record.check_in ? formatIndiaTimeWith12Hour(record.check_in) : '-'}
                  </td>
                  <td>
                    {record.check_out ? formatIndiaTimeWith12Hour(record.check_out) : '-'}
                  </td>
                  <td>
                    <strong>{formatHoursDecimal(record.time_spent_seconds, record.status)}</strong>
                  </td>
                  <td>
                    <span
                      className={`dashboard-status-badge ${
                        record.status === 'Present' ? 'present' : 'absent'
                      }`}
                    >
                      {record.status === 'Present' ? '✓ Present' : '✗ Absent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AttendanceTable;
