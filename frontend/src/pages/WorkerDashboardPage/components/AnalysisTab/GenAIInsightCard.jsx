import React from 'react';

const GenAIInsightCard = ({ aiInsights }) => {
  if (!aiInsights || !aiInsights.insights) return null;
  
  return (
    <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
      <h3 style={{ color: '#166534', marginBottom: '10px' }}>🤖 Generative AI Performance Insight</h3>
      <p style={{ color: '#15803d', fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>
        {aiInsights.insights}
      </p>
    </div>
  );
};

export default GenAIInsightCard;
