import React, { useState, useEffect } from 'react';
import './ConfirmReasonModal.css';

export default function ConfirmReasonModal({ isOpen, onConfirm, onCancel, title = 'Confirm Action' }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomReason('');
    }
  }, [isOpen]);

  const predefinedReasons = [
    'Sick Leave',
    'Emergency',
    'Personal Leave',
    'Holiday',
    'Other'
  ];

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (reason.trim()) {
      onConfirm(reason);
      setSelectedReason('');
      setCustomReason('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="confirm-reason-backdrop" onClick={onCancel}></div>
      <div className="confirm-reason-modal">
        <div className="confirm-reason-header">
          <h3>{title}</h3>
          <button className="confirm-reason-close" onClick={onCancel}>✕</button>
        </div>

        <div className="confirm-reason-content">
          <p className="confirm-reason-subtitle">Please select or enter a reason:</p>

          <div className="confirm-reason-buttons">
            {predefinedReasons.map((reason) => (
              <button
                key={reason}
                className={`confirm-reason-button ${selectedReason === reason ? 'active' : ''}`}
                onClick={() => setSelectedReason(reason)}
              >
                {reason}
              </button>
            ))}
          </div>

          {selectedReason === 'Other' && (
            <textarea
              className="confirm-reason-textarea"
              placeholder="Enter custom reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows="4"
            />
          )}
        </div>

        <div className="confirm-reason-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}
