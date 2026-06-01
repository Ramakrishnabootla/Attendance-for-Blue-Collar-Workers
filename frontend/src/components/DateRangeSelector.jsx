import React, { useState } from 'react';
import { getTodayIndia } from '../utils/timezoneHelper';
import './DateRangeSelector.css';

export default function DateRangeSelector({ onDateRangeSelect, onCancel }) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(getTodayIndia());
    d.setDate(d.getDate() - 29); // default 30 days range
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(getTodayIndia());

  const handleApply = () => {
    if (startDate && endDate) {
      if (startDate > endDate) {
        alert('Start date cannot be after End date');
        return;
      }
      onDateRangeSelect(startDate, endDate);
    }
  };

  const handleToday = () => {
    const today = getTodayIndia();
    setStartDate(today);
    setEndDate(today);
    onDateRangeSelect(today, today);
  };

  const handleYesterday = () => {
    const today = new Date(getTodayIndia());
    today.setDate(today.getDate() - 1);
    const yesterday = today.toISOString().split('T')[0];
    setStartDate(yesterday);
    setEndDate(yesterday);
    onDateRangeSelect(yesterday, yesterday);
  };

  const handleLast7Days = () => {
    const today = new Date(getTodayIndia());
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    const startStr = start.toISOString().split('T')[0];
    const endStr = getTodayIndia();
    setStartDate(startStr);
    setEndDate(endStr);
    onDateRangeSelect(startStr, endStr);
  };

  const handleLast30Days = () => {
    const today = new Date(getTodayIndia());
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    const startStr = start.toISOString().split('T')[0];
    const endStr = getTodayIndia();
    setStartDate(startStr);
    setEndDate(endStr);
    onDateRangeSelect(startStr, endStr);
  };

  return (
    <div className="date-range-selector">
      <div className="date-range-header">
        <h4>Select Date Range</h4>
        <button className="date-range-close" onClick={onCancel}>✕</button>
      </div>

      <div className="date-range-content">
        <div className="date-range-quick-buttons">
          <button className="date-range-quick-btn" onClick={handleToday}>
            Today
          </button>
          <button className="date-range-quick-btn" onClick={handleYesterday}>
            Yesterday
          </button>
          <button className="date-range-quick-btn" onClick={handleLast7Days}>
            Last 7 Days
          </button>
          <button className="date-range-quick-btn" onClick={handleLast30Days}>
            Last 30 Days
          </button>
        </div>

        <div className="date-range-divider"></div>

        <div className="date-range-input-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div className="date-range-input-group" style={{ flex: 1 }}>
            <label>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-range-input"
            />
          </div>
          <div className="date-range-input-group" style={{ flex: 1 }}>
            <label>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-range-input"
            />
          </div>
        </div>
      </div>

      <div className="date-range-footer">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleApply}>
          Apply Range
        </button>
      </div>
    </div>
  );
}
