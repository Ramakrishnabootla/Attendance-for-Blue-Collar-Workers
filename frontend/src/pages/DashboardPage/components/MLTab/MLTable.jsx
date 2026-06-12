import React from 'react';

const MLTable = ({ mlPredictions, mlSearchQuery }) => {
  return (
    <div className="ml-predictions-table-card card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="table-wrapper">
        <table className="ml-predictions-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '2px solid var(--border-light)' }}>
              <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Worker ID</th>
              <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Name</th>
              <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Job Type</th>
              <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Contractor</th>
              <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>ML Prediction Category</th>
              <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Risk Level</th>
              <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Recommendations & Action Items</th>
            </tr>
          </thead>
          <tbody>
            {mlPredictions.filter(p => {
              if (!mlSearchQuery.trim()) return true;
              const q = mlSearchQuery.toLowerCase();
              return (p.worker_id || '').toLowerCase().includes(q) ||
                     (p.name || '').toLowerCase().includes(q) ||
                     (p.prediction?.category || '').toLowerCase().includes(q) ||
                     (p.prediction?.risk_level || '').toLowerCase().includes(q);
            }).length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)', fontStyle: 'italic' }}>No predictions matched your filters.</td>
              </tr>
            ) : (
              mlPredictions.filter(p => {
                if (!mlSearchQuery.trim()) return true;
                const q = mlSearchQuery.toLowerCase();
                return (p.worker_id || '').toLowerCase().includes(q) ||
                       (p.name || '').toLowerCase().includes(q) ||
                       (p.prediction?.category || '').toLowerCase().includes(q) ||
                       (p.prediction?.risk_level || '').toLowerCase().includes(q);
              }).map((p) => {
                const categoryName = p.prediction?.category === 'High_Risk' 
                  ? 'High Absence Risk' 
                  : p.prediction?.category === 'Irregular' 
                    ? 'Irregular Attendance' 
                    : 'Regular Worker';

                const isHigh = p.prediction?.risk_level === 'HIGH';
                const isMed = p.prediction?.risk_level === 'MEDIUM';
                
                const badgeColor = isHigh ? 'var(--danger-red-dark)' : isMed ? 'var(--warning-yellow-dark)' : 'var(--success-green-dark)';
                const badgeBg = isHigh ? '#FEF2F2' : isMed ? '#FEFCE8' : '#F0FDF4';
                const badgeBorder = isHigh ? '#FEE2E2' : isMed ? '#FEF08A' : '#DCFCE7';

                const catColor = isHigh ? 'var(--danger-red)' : isMed ? '#D97706' : 'var(--success-green)';

                return (
                  <tr key={p.worker_id} style={{ borderBottom: '1px solid var(--border-lighter)' }}>
                    <td style={{ padding: '14px 18px' }}><strong>{p.worker_id}</strong></td>
                    <td style={{ padding: '14px 18px' }}>{p.name}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: 'var(--bg-lighter)',
                        color: 'var(--text-medium)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {p.job_type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>{p.contractor_name}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <strong style={{ color: catColor }}>
                        {categoryName}
                      </strong>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        color: badgeColor,
                        backgroundColor: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        textAlign: 'center'
                      }}>
                        {p.prediction?.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-medium)', lineHeight: '1.5' }}>
                        {(p.prediction?.recommendations || []).map((rec, rIdx) => (
                          <li key={rIdx}>{rec}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MLTable;
