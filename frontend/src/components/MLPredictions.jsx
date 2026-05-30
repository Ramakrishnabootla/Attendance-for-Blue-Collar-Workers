import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';
import './MLPredictions.css';

const MLPredictions = ({ contractorId }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all'); // all, high, medium, low

  useEffect(() => {
    if (contractorId) {
      fetchPredictions();
    }
  }, [contractorId]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch workers first
      const workersRes = await fetch(`${API_BASE_URL}/workers?contractor_id=${contractorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!workersRes.ok) throw new Error('Failed to fetch workers');

      const workersData = await workersRes.json();
      const workers = workersData.data || [];

      // Fetch predictions for each worker
      const predictionsData = await Promise.all(
        workers.map(async (worker) => {
          try {
            const res = await fetch(`${API_BASE_URL}/ml/worker/${worker.id}/prediction`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (res.ok) {
              const data = await res.json();
              return {
                worker_id: worker.id,
                worker_name: worker.name,
                ...data.prediction,
                statistics: data.statistics
              };
            }
            return null;
          } catch (err) {
            return null;
          }
        })
      );

      setPredictions(predictionsData.filter(p => p !== null));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
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
        <div className="controls">
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="risk-filter"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
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
