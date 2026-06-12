import React from 'react';
import AIInsights from '../../../../components/AIInsights';
import './AITab.css';

const AITab = ({
  selectedAiContractor,
  setSelectedAiContractor,
  uniqueContractors
}) => {
  return (
    <div className="dashboard-section" style={{ marginTop: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Filter by Contractor:</label>
        <select
          value={selectedAiContractor}
          onChange={(e) => setSelectedAiContractor(e.target.value)}
          style={{
            height: '40px',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
            padding: '0 12px',
            fontSize: '14px',
            minWidth: '200px'
          }}
        >
          <option value="all">All Contractors</option>
          {uniqueContractors.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
          ))}
        </select>
      </div>
      <AIInsights contractorId={selectedAiContractor} period="weekly" />
    </div>
  );
};

export default AITab;
