import React, { useState } from 'react';
import { getTodayIndia } from '../utils/timezoneHelper';
import './DateRangeSelector.css';

export default function DateRangeSelector({ onDateSelect, onCancel }) {
  const [selectedDate, setSelectedDate] = useState(getTodayIndia());
  const [view, setView] = useState('calendar'); // 'calendar' or 'input'

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleApply = () => {
    if (selectedDate) {
      onDateSelect(selectedDate);
    }
  };

  const handleToday = () => {
    const today = getTodayIndia();
    setSelectedDate(today);
    onDateSelect(today);
  };

  const handleYesterday = () => {
    const today = new Date(getTodayIndia());
    today.setDate(today.getDate() - 1);
    const yesterday = today.toISOString().split('T')[0];
    setSelectedDate(yesterday);
    onDateSelect(yesterday);
  };

  const handleLast7Days = () => {
    const today = new Date(getTodayIndia());
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);
    const start = startDate.toISOString().split('T')[0];
    onDateSelect(start, getTodayIndia());
  };

  return (
    <div className="date-range-selector">
      <div className="date-range-header">
        <h4>Select Date</h4>
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
        </div>

        <div className="date-range-divider"></div>

        <div className="date-range-input-group">
          <label>Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="date-range-input"
          />
          <p className="date-range-info">
            Showing workers created on: <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN')}</strong>
          </p>
        </div>
      </div>

      <div className="date-range-footer">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleApply}>
          Apply Filter
        </button>
      </div>
    </div>
  );
}
