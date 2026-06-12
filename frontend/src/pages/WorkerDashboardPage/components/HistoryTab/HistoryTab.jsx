import React from 'react';
import TodayStatusWidget from './TodayStatusWidget';
import AttendanceLogTable from './AttendanceLogTable';
import './HistoryTab.css';

const HistoryTab = ({
  todayDateStr,
  todayRecord,
  formatHours,
  history,
  loading,
  error
}) => {
  return (
    <>
      <TodayStatusWidget
        todayDateStr={todayDateStr}
        todayRecord={todayRecord}
        formatHours={formatHours}
      />
      <AttendanceLogTable
        history={history}
        loading={loading}
        error={error}
        formatHours={formatHours}
      />
    </>
  );
};

export default HistoryTab;
