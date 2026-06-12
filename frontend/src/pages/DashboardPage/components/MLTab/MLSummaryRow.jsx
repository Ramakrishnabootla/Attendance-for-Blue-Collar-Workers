import React from 'react';

const MLSummaryRow = ({ mlPredictions }) => {
  return (
    <div className="ml-summary-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div className="ml-stat-card card" style={{ padding: '16px', textAlign: 'center', borderTop: '4px solid var(--primary-blue)' }}>
        <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0' }}>{mlPredictions.length}</h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Total Evaluated Workers</p>
      </div>
      <div className="ml-stat-card card" style={{ padding: '16px', textAlign: 'center', borderTop: '4px solid var(--success-green)' }}>
        <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--success-green-dark)' }}>
          {mlPredictions.filter(p => p.prediction?.category === 'Regular').length}
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Regular Workers (Low Risk)</p>
      </div>
      <div className="ml-stat-card card" style={{ padding: '16px', textAlign: 'center', borderTop: '4px solid var(--warning-yellow)' }}>
        <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--warning-yellow-dark)' }}>
          {mlPredictions.filter(p => p.prediction?.category === 'Irregular').length}
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Irregular Attendance (Medium Risk)</p>
      </div>
      <div className="ml-stat-card card" style={{ padding: '16px', textAlign: 'center', borderTop: '4px solid var(--danger-red)' }}>
        <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--danger-red-dark)' }}>
          {mlPredictions.filter(p => p.prediction?.category === 'High_Risk').length}
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase' }}>High Absence Risk (High Risk)</p>
      </div>
    </div>
  );
};

export default MLSummaryRow;
