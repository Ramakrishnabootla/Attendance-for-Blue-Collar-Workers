import React from 'react';

const AttendanceSummaryCards = ({
  totalRecords,
  presentCount,
  absentCount,
  presentPercentage,
  totalHours
}) => {
  return (
    <div className="dashboard-summary-row">
      <div className="dashboard-card">
        <h3>{totalRecords}</h3>
        <p>Total Records</p>
      </div>
      <div className="dashboard-card present">
        <h3>{presentCount}</h3>
        <p>Present</p>
      </div>
      <div className="dashboard-card absent">
        <h3>{absentCount}</h3>
        <p>Absent</p>
      </div>
      <div className="dashboard-card percentage">
        <h3>{presentPercentage}%</h3>
        <p>Attendance Rate</p>
      </div>
      <div className="dashboard-card hours-card" style={{ borderTopColor: 'var(--warning-yellow)' }}>
        <h3 style={{ color: 'var(--warning-yellow-dark)' }}>{totalHours} hrs</h3>
        <p>Total Hours Worked</p>
      </div>
    </div>
  );
};

export default AttendanceSummaryCards;
