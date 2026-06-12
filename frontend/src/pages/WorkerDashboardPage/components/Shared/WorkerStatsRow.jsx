import React from 'react';
import './WorkerStatsRow.css';

const WorkerStatsRow = ({ presentDays, totalDays, attendanceRate, totalHours }) => {
  return (
    <div className="worker-stats-row">
      <div className="worker-stat-card card">
        <h3>{presentDays} / {totalDays}</h3>
        <p>Days Present</p>
      </div>
      <div className="worker-stat-card card rate-card">
        <h3>{attendanceRate}%</h3>
        <p>Attendance Rate</p>
      </div>
      <div className="worker-stat-card card hours-card">
        <h3>{totalHours} hrs</h3>
        <p>Total Hours Worked</p>
      </div>
    </div>
  );
};

export default WorkerStatsRow;
