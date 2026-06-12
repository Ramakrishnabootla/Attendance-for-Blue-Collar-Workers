import React from 'react';
import SearchBar from '../../../../components/SearchBar';
import DateRangeSelector from '../../../../components/DateRangeSelector';

const AttendanceControls = ({
  searchQuery,
  handleSearchResults,
  shiftFilter,
  setShiftFilter,
  isFilteredDate,
  showDateSelector,
  setShowDateSelector,
  loadDashboard,
  handleExportCSV,
  activeRecords,
  handleDateRangeSelect
}) => {
  return (
    <>
      <div className="dashboard-controls" style={{ gap: '12px', flexWrap: 'wrap', display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <div className="dashboard-control-item" style={{ flex: 1, minWidth: '200px' }}>
          <SearchBar onSearch={handleSearchResults} placeholder="Search worker ID, name, or job..." />
        </div>

        <div style={{ minWidth: '150px' }}>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="shift-filter-select"
            style={{
              height: '46px',
              borderRadius: '10px',
              border: '2px solid var(--border-light)',
              padding: '0 12px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-medium)',
              backgroundColor: 'white',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <option value="All">All Shifts</option>
            <option value="General">General Shift</option>
            <option value="Morning">Morning Shift</option>
            <option value="Evening">Evening Shift</option>
            <option value="Night">Night Shift</option>
          </select>
        </div>

        <button
          className={`btn ${isFilteredDate ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setShowDateSelector(!showDateSelector)}
        >
          📅 {isFilteredDate ? 'Change Range' : 'Select Date Range'}
        </button>

        {isFilteredDate && (
          <button
            className="btn btn-secondary"
            onClick={loadDashboard}
          >
            ← Reset Today
          </button>
        )}

        <button
          className="btn btn-secondary"
          onClick={loadDashboard}
        >
          🔄 Refresh
        </button>

        <button
          className="btn btn-success"
          onClick={handleExportCSV}
          disabled={activeRecords.length === 0}
        >
          📥 Export CSV
        </button>
      </div>

      {showDateSelector && (
        <div className="dashboard-date-selector-wrapper">
          <DateRangeSelector
            onDateRangeSelect={handleDateRangeSelect}
            onCancel={() => setShowDateSelector(false)}
          />
        </div>
      )}
    </>
  );
};

export default AttendanceControls;
