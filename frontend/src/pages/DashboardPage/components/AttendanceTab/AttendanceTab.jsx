import React from 'react';
import AttendanceControls from './AttendanceControls';
import AttendanceSummaryCards from './AttendanceSummaryCards';
import AttendanceTable from './AttendanceTable';
import './AttendanceTab.css';

const AttendanceTab = (props) => {
  return (
    <>
      <AttendanceControls {...props} />
      <AttendanceSummaryCards {...props} />
      <AttendanceTable {...props} />
    </>
  );
};

export default AttendanceTab;
