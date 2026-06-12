import React from 'react';
import './WorkerProfileHeader.css';

const WorkerProfileHeader = ({ worker, handleLogoutClick }) => {
  return (
    <div className="worker-profile-card card">
      <div className="worker-profile-header">
        <div className="worker-avatar">👷</div>
        <div className="worker-meta">
          <h2>{worker?.name}</h2>
          <p className="worker-badge">{worker?.job_type}</p>
        </div>
        <button className="btn btn-danger logout-header-btn" onClick={handleLogoutClick}>
          🚪 Logout
        </button>
      </div>
      <div className="worker-profile-grid">
        <div className="profile-item">
          <span className="profile-label">Worker ID</span>
          <span className="profile-value">{worker?.worker_id}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Contractor</span>
          <span className="profile-value">{worker?.contractor_name || 'General Contractors'}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Registered Phone</span>
          <span className="profile-value">{worker?.phone || 'Not Registered'}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfileHeader;
