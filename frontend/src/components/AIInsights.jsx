import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';
import './AIInsights.css';

const AIInsights = ({ contractorId, period = 'weekly' }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch insights on component mount and when period changes
  useEffect(() => {
    fetchInsights();
  }, [contractorId, period]);

  const fetchInsights = async () => {
    if (!contractorId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/ai/contractor/${contractorId}/insights?period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  if (!contractorId) {
    return (
      <div className="ai-insights-container">
        <p className="error-message">Please select a contractor to view insights</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ai-insights-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading AI Insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-insights-container">
        <div className="error-box">
          <h3>⚠️ Error Loading Insights</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="ai-insights-container">
        <p>No insights available</p>
      </div>
    );
  }

  return (
    <div className="ai-insights-container">
      <div className="insights-header">
        <h2>🤖 AI Insights & Predictions</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
        >
          {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card summary-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total Workers</h3>
            <p className="metric">{insights.summary.total_workers}</p>
          </div>
        </div>
        <div className="card summary-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Attendance Rate</h3>
            <p className="metric">{insights.summary.avg_attendance_rate}%</p>
          </div>
        </div>
        <div className="card summary-card">
          <div className="card-icon">⏰</div>
          <div className="card-content">
            <h3>On-Time Rate</h3>
            <p className="metric">{insights.summary.on_time_percentage}%</p>
          </div>
        </div>
        <div className="card summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Period</h3>
            <p className="metric capitalize">{period}</p>
          </div>
        </div>
      </div>

      {/* AI Generated Insights Section */}
      <div className="insights-section" style={{ marginTop: '24px' }}>
        <div className="card insights-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
          <h3 style={{ color: '#166534', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>📝 Generative AI Performance Insight</h3>
          <p className="insights-text" style={{ color: '#15803d', fontSize: '16px', fontWeight: '500', lineHeight: '1.6' }}>
            {insights.insights}
          </p>
          <div className="timestamp" style={{ marginTop: '16px', fontSize: '12px', color: '#166534', opacity: 0.8 }}>
            Generated: {new Date(insights.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
