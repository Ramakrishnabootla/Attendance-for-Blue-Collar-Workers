import React from 'react';

const MLControls = ({
  mlSearchQuery,
  setMlSearchQuery,
  handleReRunPredictions,
  mlLoading
}) => {
  return (
    <div className="ml-controls-row card" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', padding: '16px' }}>
      <div className="ml-search-box" style={{ flex: 1 }}>
        <input
          type="text"
          placeholder="🔍 Search worker ID, name, or risk level (e.g. HIGH, LOW)..."
          value={mlSearchQuery}
          onChange={(e) => setMlSearchQuery(e.target.value)}
          className="ml-search-input"
          style={{
            width: '100%',
            height: '46px',
            borderRadius: '10px',
            border: '2px solid var(--border-light)',
            padding: '0 16px',
            fontSize: '14px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
      </div>
      <button 
        className="btn btn-outline" 
        onClick={handleReRunPredictions} 
        disabled={mlLoading}
        style={{ height: '46px', minWidth: '220px' }}
      >
        {mlLoading ? '⏳ Scoring Models...' : '🔄 Re-Run ML Predictions'}
      </button>
    </div>
  );
};

export default MLControls;
