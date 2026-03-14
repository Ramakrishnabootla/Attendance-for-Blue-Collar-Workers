import React from 'react';
import './IDCardPopup.css';

export default function IDCardPopup({ isOpen, worker, onClose }) {
  if (!isOpen || !worker) return null;

  const createdDate = new Date(worker.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <>
      <div className="id-card-backdrop" onClick={onClose}></div>
      <div className="id-card-popup">
        <button className="id-card-close" onClick={onClose}>✕</button>

        <div className="id-card">
          <div className="id-card-header">
            <div className="id-card-logo">👷</div>
            <div className="id-card-company">
              <h4>BlueTrack</h4>
              <p>Worker ID Card</p>
            </div>
          </div>

          <div className="id-card-divider"></div>

          <div className="id-card-content">
            <div className="id-card-field">
              <label>Worker ID</label>
              <div className="id-card-value">{worker.worker_id}</div>
            </div>

            <div className="id-card-field">
              <label>Name</label>
              <div className="id-card-value">{worker.name}</div>
            </div>

            <div className="id-card-field">
              <label>Job Type</label>
              <div className="id-card-value">{worker.job_type}</div>
            </div>

            <div className="id-card-field">
              <label>Phone</label>
              <div className="id-card-value">{worker.phone || 'N/A'}</div>
            </div>

            <div className="id-card-field">
              <label>Member Since</label>
              <div className="id-card-value">{createdDate}</div>
            </div>

            <div className="id-card-status">
              <span className={`status-badge ${worker.is_active ? 'active' : 'inactive'}`}>
                {worker.is_active ? '✓ Active' : '✗ Inactive'}
              </span>
            </div>
          </div>

          <div className="id-card-footer">
            <p>This card is for official identification only</p>
          </div>
        </div>
      </div>
    </>
  );
}
