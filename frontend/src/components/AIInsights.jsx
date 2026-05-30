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

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'performers' ? 'active' : ''}`}
          onClick={() => setActiveTab('performers')}
        >
          Top Performers
        </button>
        <button
          className={`tab-btn ${activeTab === 'concerns' ? 'active' : ''}`}
          onClick={() => setActiveTab('concerns')}
        >
          Needs Attention
        </button>
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="insights-section">
            <div className="card insights-card">
              <h3>📝 AI Generated Insights</h3>
              <p className="insights-text">{insights.insights}</p>
              <div className="timestamp">
                Generated: {new Date(insights.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performers' && (
          <div className="insights-section">
            <h3>🌟 Top Performers</h3>
            <div className="performers-list">
              {insights.highlights.top_performers.map((worker, idx) => (
                <div key={idx} className="card performer-card">
                  <div className="rank">{idx + 1}</div>
                  <div className="performer-info">
                    <h4>{worker.name}</h4>
                    <p>Attendance: <span className="metric">{worker.attendance_rate}%</span></p>
                    <span className="status-badge excellent">{worker.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'concerns' && (
          <div className="insights-section">
            <h3>⚠️ Needs Attention</h3>
            <div className="concerns-list">
              {insights.highlights.concerns.map((worker, idx) => (
                <div key={idx} className="card concern-card">
                  <div className="rank">{idx + 1}</div>
                  <div className="concern-info">
                    <h4>{worker.name}</h4>
                    <p>Attendance: <span className="metric">{worker.attendance_rate}%</span></p>
                    <p>Late Days: <span className="metric">{worker.late_count}</span></p>
                    <span className="status-badge warning">{worker.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="insights-section">
            <h3>💡 Data-Driven Recommendations</h3>
            <div className="recommendations-list">
              {insights.recommendations.map((rec, idx) => (
                <div key={idx} className="card recommendation-card">
                  <div className={`priority-badge ${rec.priority.toLowerCase()}`}>
                    {rec.priority}
                  </div>
                  <div className="recommendation-text">
                    <p>{rec.suggestion}</p>
                  </div>
                </div>
              ))}
              {insights.recommendations.length === 0 && (
                <p className="no-issues">✓ No immediate recommendations - keep up the good work!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
