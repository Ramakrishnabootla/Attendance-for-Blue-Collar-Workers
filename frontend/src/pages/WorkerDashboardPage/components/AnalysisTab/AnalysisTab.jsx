import React from 'react';
import { formatDateReadable } from '../../../../utils/timezoneHelper';
import GenAIInsightCard from './GenAIInsightCard';
import MLVisualDashboard from './MLVisualDashboard';
import './AnalysisTab.css';

const AnalysisTab = ({ mlData, loadingMl, aiInsights }) => {
  return (
    <div className="analysis-tab-wrapper">
      {loadingMl ? (
        <div className="spinner" style={{ margin: '40px auto' }}></div>
      ) : !mlData ? (
        <div className="analysis-locked-card card">
          <span className="locked-icon">⏳</span>
          <h3>Connecting to AI Engine...</h3>
          <p>Establishing secure connection to Scikit-Learn prediction environment...</p>
        </div>
      ) : mlData.insufficient ? (
        <div className="analysis-locked-card card">
          <span className="locked-icon">🔒</span>
          <h3>AI Behavioral Analysis Compiling</h3>
          <p>
            AI scheduling models and absence risk profiles are currently locked for this profile.
            Our classification engine requires at least <strong>7 days</strong> of active attendance history to calibrate your baseline habits.
          </p>
          <div style={{ marginTop: '20px', display: 'inline-block', background: '#F3F4F6', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', color: '#4B5563' }}>
            📈 Progress: {mlData.days_recorded} / 7 Days Tracked
          </div>
          <p style={{ marginTop: '15px', fontSize: '13px', color: '#6B7280' }}>
            Please keep checking in consistently to unlock your custom behavior dashboard!
          </p>
        </div>
      ) : (
        <>
          <GenAIInsightCard aiInsights={aiInsights} />

          {/* Insights Hero Banner */}
          <div className="ml-insights-hero">
            <div className="hero-left">
              <h3>
                {mlData.prediction.category === 'Regular' && '✨ Outstanding Attendance Profile'}
                {mlData.prediction.category === 'Irregular' && '⚠️ Shift Adherence Coaching'}
                {mlData.prediction.category === 'High_Risk' && '🚨 Critical Absence Alert'}
              </h3>
              <p>
                Our Scikit-Learn Random Forest model analyzes your trailing 30-day punctuality, late arrivals, shift gaps, and total duration to score your scheduling consistency.
              </p>
              {mlData.calculated_at && (
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600' }}>
                  📊 AI analysis computed by supervisor on {formatDateReadable(mlData.calculated_at.split('T')[0])}
                </p>
              )}
            </div>
            <div className="hero-badge-liveness">
              <span className="pulse-dot"></span> ML Profile Calibrated
            </div>
          </div>

          <MLVisualDashboard mlData={mlData} />
        </>
      )}
    </div>
  );
};

export default AnalysisTab;
