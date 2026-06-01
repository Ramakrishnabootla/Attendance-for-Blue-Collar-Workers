import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';
import './MLPredictions.css';

const MLPredictions = ({ contractorId }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all'); // all, high, medium, low

  useEffect(() => {
    fetchPredictions();
  }, [contractorId]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/ml/predictions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch predictions');

      const data = await res.json();
      const items = data.predictions || [];

      setPredictions(items.map(item => ({
        worker_id: item.worker_id,
        worker_name: item.name,
        category: item.prediction?.category || 'Insufficient Data',
        confidence: item.prediction?.confidence || 0.0,
        risk_level: item.prediction?.risk_level || 'UNKNOWN',
        recommendations: item.prediction?.recommendations || [],
        statistics: {
          attendance_rate: item.prediction?.attendance_rate || 100.0,
          late_arrivals: item.prediction?.late_arrivals || 0,
          absences_30d: item.prediction?.days_recorded ? (30 - item.prediction.days_recorded) : 0
        },
        calculated_at: item.prediction?.calculated_at
      })));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    try {
      setGenerating(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/ml/predictions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!res.ok) throw new Error('Failed to generate predictions');

      // Refresh list after generation
      await fetchPredictions();
    } catch (err) {
      setError(err.message);
      console.error('Error generating predictions:', err);
    } finally {
      setGenerating(false);
    }
  };

  const getRiskColor = (risk_level) => {
    switch (risk_level) {
      case 'LOW': return '#2ecc71';
      case 'MEDIUM': return '#f39c12';
      case 'HIGH': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getRiskBadgeClass = (risk_level) => {
    switch (risk_level) {
      case 'LOW': return 'badge-low';
      case 'MEDIUM': return 'badge-medium';
      case 'HIGH': return 'badge-high';
      default: return 'badge-default';
    }
  };

  const filteredPredictions = predictions.filter(p => {
    if (filterRisk === 'all') return true;
    return p.risk_level === filterRisk.toUpperCase();
  });

  if (loading) {
    return (
      <div className="ml-predictions-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading predictions...</p>
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="ml-predictions-container">
        <div className="loading">
          <div className="spinner"></div>
          <p style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>⚡ AI Engine executing model predictions...</p>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '8px' }}>Aggregating supervisor punch logs & calculating workforce risk matrices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-predictions-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ml-predictions-container">
      <div className="predictions-header">
        <h2>🧠 Worker Behavior Predictions</h2>
        <div className="controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="risk-filter"
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
          <button 
            onClick={generatePredictions} 
            className="btn btn-primary"
            style={{ 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🧠 Run AI Predictor
          </button>
          <button onClick={fetchPredictions} className="refresh-btn">
            ⟳ Refresh
          </button>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Total Workers:</span>
          <span className="stat-value">{predictions.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Regular:</span>
          <span className="stat-value" style={{ color: '#2ecc71' }}>
            {predictions.filter(p => p.risk_level === 'LOW').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Irregular:</span>
          <span className="stat-value" style={{ color: '#f39c12' }}>
            {predictions.filter(p => p.risk_level === 'MEDIUM').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">High Risk:</span>
          <span className="stat-value" style={{ color: '#e74c3c' }}>
            {predictions.filter(p => p.risk_level === 'HIGH').length}
          </span>
        </div>
      </div>

      <div className="predictions-table-wrapper">
        <table className="predictions-table">
          <thead>
            <tr>
              <th>Worker Name</th>
              <th>Category</th>
              <th>Confidence</th>
              <th>Risk Level</th>
              <th>Attendance Rate</th>
              <th>Late Arrivals</th>
              <th>Absences (30d)</th>
              <th>Recommendations</th>
            </tr>
          </thead>
          <tbody>
            {filteredPredictions.map((pred, idx) => (
              <tr key={idx} className={`risk-${pred.risk_level.toLowerCase()}`}>
                <td className="worker-name">{pred.worker_name}</td>
                <td className="category">{pred.category}</td>
                <td className="confidence">
                  <span className="confidence-bar">
                    <span
                      className="confidence-fill"
                      style={{ width: `${pred.confidence * 100}%` }}
                    ></span>
                  </span>
                  <span className="confidence-text">{(pred.confidence * 100).toFixed(0)}%</span>
                </td>
                <td className="risk-level">
                  <span className={`risk-badge ${getRiskBadgeClass(pred.risk_level)}`}>
                    {pred.risk_level}
                  </span>
                </td>
                <td className="stat">{pred.statistics?.attendance_rate?.toFixed(1)}%</td>
                <td className="stat">{pred.statistics?.late_arrivals || 0}</td>
                <td className="stat">{pred.statistics?.absences_30d || 0}</td>
                <td className="recommendations">
                  <button
                    className="recommendations-btn"
                    title={pred.recommendations?.join('\n')}
                  >
                    💡 {pred.recommendations?.length || 0}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPredictions.length === 0 && (
          <p className="no-data">No predictions available for the selected filter</p>
        )}
      </div>

      {/* Recommendations Modal (on hover) */}
      <div className="recommendations-legend">
        <h4>Legend</h4>
        <p><span className="badge-low">●</span> Regular: Consistent attendance</p>
        <p><span className="badge-medium">●</span> Irregular: Sporadic attendance patterns</p>
        <p><span className="badge-high">●</span> High Risk: Frequent absenteeism - requires attention</p>
      </div>
    </div>
  );
};

export default MLPredictions;
