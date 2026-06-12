import React from 'react';

const MLVisualDashboard = ({ mlData }) => {
  return (
    <div className="ml-dashboard">
      {/* Metric Circle Indicator */}
      <div className="ml-card-main card">
        <div className="ml-badge-container">
          <span className="ml-badge-large" style={{ 
            backgroundColor: mlData.prediction.category === 'Regular' ? '#E6F4EA' : mlData.prediction.category === 'Irregular' ? '#FFF3E0' : '#FFEBEE',
            color: mlData.prediction.category === 'Regular' ? '#137333' : mlData.prediction.category === 'Irregular' ? '#E65100' : '#C62828'
          }}>
            {mlData.prediction.category === 'Regular' && 'Regular Worker'}
            {mlData.prediction.category === 'Irregular' && 'Irregular Attendance'}
            {mlData.prediction.category === 'High_Risk' && 'High Absence Risk'}
          </span>
        </div>

        {/* Circular Progress Gauge */}
        <div className="ml-confidence-gauge" style={{
          background: `conic-gradient(${
            mlData.prediction.category === 'Regular' ? '#10B981' : mlData.prediction.category === 'Irregular' ? '#F59E0B' : '#EF4444'
          } 0% ${Math.round(mlData.prediction.confidence * 100)}%, #E4E4E7 ${Math.round(mlData.prediction.confidence * 100)}% 100%)`
        }}>
          <div className="gauge-text">
            <span className="gauge-percentage">{Math.round(mlData.prediction.confidence * 100)}%</span>
            <span className="gauge-label">Confidence</span>
          </div>
        </div>

        {/* Risk Bar Slider */}
        <div className="ml-risk-thermometer">
          <div className="thermo-header">
            <span>Attendance Risk</span>
            <span style={{ 
              color: mlData.prediction.risk_level === 'LOW' ? '#10B981' : mlData.prediction.risk_level === 'MEDIUM' ? '#F59E0B' : '#EF4444'
            }}>{mlData.prediction.risk_level}</span>
          </div>
          <div className="thermo-bar-bg">
            <div className="thermo-bar-fill" style={{ 
              width: mlData.prediction.risk_level === 'LOW' ? '15%' : mlData.prediction.risk_level === 'MEDIUM' ? '55%' : '90%',
              background: mlData.prediction.risk_level === 'LOW' ? '#10B981' : mlData.prediction.risk_level === 'MEDIUM' ? '#F59E0B' : '#EF4444'
            }}></div>
          </div>
        </div>
      </div>

      {/* Coaching and Actionable Recommendations */}
      <div className="ml-card-coaching card">
        <h3>💡 AI Scheduling & Growth Coaching</h3>
        <div className="coaching-tips-list">
          {mlData.prediction.recommendations && mlData.prediction.recommendations.map((rec, i) => (
            <div className="coaching-tip-item" key={i}>
              <span className="tip-number">{i + 1}</span>
              <p className="tip-content">{rec}</p>
            </div>
          ))}
          {(!mlData.prediction.recommendations || mlData.prediction.recommendations.length === 0) && (
            <>
              <div className="coaching-tip-item">
                <span className="tip-number">1</span>
                <p className="tip-content"><strong>Keep punctuality high:</strong> Try to check in before 9:00 AM for morning shifts.</p>
              </div>
              <div className="coaching-tip-item">
                <span className="tip-number">2</span>
                <p className="tip-content"><strong>Bonus eligibility:</strong> You are fully qualified for the consistent worker monthly reward incentive!</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLVisualDashboard;
