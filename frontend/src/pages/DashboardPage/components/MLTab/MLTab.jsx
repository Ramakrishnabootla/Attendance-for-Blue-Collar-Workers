import React from 'react';
import MLSummaryRow from './MLSummaryRow';
import MLControls from './MLControls';
import MLTable from './MLTable';
import './MLTab.css';

const MLTab = ({
  mlError,
  mlPredictions,
  mlSearchQuery,
  setMlSearchQuery,
  handleReRunPredictions,
  mlLoading
}) => {
  return (
    <div className="ml-panel-content slide-in-animation">
      {mlError && <div className="alert alert-error">{mlError}</div>}
      
      <MLSummaryRow mlPredictions={mlPredictions} />
      
      <MLControls 
        mlSearchQuery={mlSearchQuery}
        setMlSearchQuery={setMlSearchQuery}
        handleReRunPredictions={handleReRunPredictions}
        mlLoading={mlLoading}
      />

      {mlLoading ? (
        <div className="spinner-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <p className="loading-text" style={{ fontStyle: 'italic', color: 'var(--text-light)' }}>Random Forest Classifier is analyzing historical trends and absences averages...</p>
        </div>
      ) : (
        <MLTable 
          mlPredictions={mlPredictions} 
          mlSearchQuery={mlSearchQuery} 
        />
      )}
    </div>
  );
};

export default MLTab;
