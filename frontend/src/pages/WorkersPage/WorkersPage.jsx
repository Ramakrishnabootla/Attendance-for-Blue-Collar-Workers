import { useState, useEffect } from 'react'
import {
  fetchWorkers,
  createWorker,
  searchWorkers,
  getNextWorkerId,
  updateWorker,
  deactivateWorker,
  activateWorker
} from '../../utils/api'
import SearchBar from '../../components/SearchBar'
import ConfirmReasonModal from '../../components/ConfirmReasonModal'
import IDCardPopup from '../../components/IDCardPopup'
import './WorkersPage.css'

const JOB_TYPES = ['Construction', 'Factory', 'Delivery', 'Contract Labour', 'Daily Wage']

function WorkersPage() {
  // Main data state
  const [allWorkers, setAllWorkers] = useState([])
  const [filteredWorkers, setFilteredWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // UI state
  const [showForm, setShowForm] = useState(false)
  const [sortByJobType, setSortByJobType] = useState('All')
  const [showInactiveWorkers, setShowInactiveWorkers] = useState(false)
  const [searchResults, setSearchResults] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    worker_id: '',
    name: '',
    phone: '',
    job_type: 'Construction'
  })

  // Modal states
  const [editingWorker, setEditingWorker] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [deactivatingWorker, setDeactivatingWorker] = useState(null)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [selectedWorkerForCard, setSelectedWorkerForCard] = useState(null)
  const [showCardPopup, setShowCardPopup] = useState(false)

  // Fetch workers on mount
  useEffect(() => {
    loadWorkers()
  }, [])

  // Filter and sort workers
  useEffect(() => {
    let result = allWorkers

    // Filter by active/inactive status
    if (showInactiveWorkers) {
      result = result.filter(w => !w.is_active)
    } else {
      result = result.filter(w => w.is_active)
    }

    // Apply job type filter
    if (sortByJobType !== 'All') {
      result = result.filter(w => w.job_type === sortByJobType)
    }

    setFilteredWorkers(result)
  }, [allWorkers, sortByJobType, showInactiveWorkers])

  // Load workers from API
  const loadWorkers = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchWorkers()
      setAllWorkers(data.workers || [])

      // Auto-generate next worker ID if form is shown
      if (showForm && !formData.worker_id) {
        await generateNextWorkerId()
      }
    } catch (err) {
      setError('Failed to load workers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate next worker ID
  const generateNextWorkerId = async () => {
    try {
      const data = await getNextWorkerId()
      if (data.success) {
        setFormData(prev => ({ ...prev, worker_id: data.next_id }))
      }
    } catch (err) {
      console.error('Failed to generate worker ID:', err)
    }
  }

  // Handle search
  const handleSearch = (results) => {
    if (results === null) {
      setSearchResults(null)
    } else {
      setSearchResults(results)
    }
  }

  // Get display workers (either search results or filtered workers)
  const displayWorkers = searchResults !== null ? searchResults : filteredWorkers

  // Add worker
  const handleAddWorker = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!formData.worker_id || !formData.name || !formData.job_type) {
      setError('All fields required')
      return
    }

    try {
      const data = await createWorker(formData)

      if (data.success) {
        setMessage('✓ Worker added successfully!')
        setFormData({ worker_id: '', name: '', phone: '', job_type: 'Construction' })
        setShowForm(false)
        await loadWorkers()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.error || 'Failed to add worker')
      }
    } catch (err) {
      setError('Connection error')
      console.error(err)
    }
  }

  // Open add worker form and generate ID
  const handleShowForm = () => {
    if (!showForm) {
      generateNextWorkerId()
    }
    setShowForm(!showForm)
  }

  // Open edit modal
  const handleEditClick = (worker) => {
    setEditingWorker(worker)
    setEditFormData({
      name: worker.name,
      phone: worker.phone,
      job_type: worker.job_type
    })
    setShowEditModal(true)
  }

  // Submit edit
  const handleEditSubmit = async () => {
    setError('')
    setMessage('')

    if (!editFormData.name || !editFormData.job_type) {
      setError('Name and Job Type are required')
      return
    }

    try {
      const data = await updateWorker(editingWorker.id, editFormData)

      if (data.success) {
        setMessage('✓ Worker updated successfully!')
        setShowEditModal(false)
        setEditingWorker(null)
        await loadWorkers()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.error || 'Failed to update worker')
      }
    } catch (err) {
      setError('Connection error')
      console.error(err)
    }
  }

  // Open deactivate modal
  const handleDeactivateClick = (worker) => {
    setDeactivatingWorker(worker)
    setShowDeactivateModal(true)
  }

  // Submit deactivate
  const handleDeactivateConfirm = async (reason) => {
    setError('')
    setMessage('')

    try {
      const data = await deactivateWorker(deactivatingWorker.id, reason)

      if (data.success) {
        setMessage('✓ Worker deactivated successfully!')
        setShowDeactivateModal(false)
        setDeactivatingWorker(null)
        await loadWorkers()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.error || 'Failed to deactivate worker')
      }
    } catch (err) {
      setError('Connection error')
      console.error(err)
    }
  }

  // Open activate (reactivate worker)
  const handleActivateClick = async (worker) => {
    setError('')
    setMessage('')

    try {
      const data = await activateWorker(worker.id)

      if (data.success) {
        setMessage('✓ Worker activated successfully!')
        await loadWorkers()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.error || 'Failed to activate worker')
      }
    } catch (err) {
      setError('Connection error')
      console.error(err)
    }
  }

  // View ID card
  const handleViewIDCard = (worker) => {
    setSelectedWorkerForCard(worker)
    setShowCardPopup(true)
  }

  const activeWorkerCount = allWorkers.filter(w => w.is_active).length
  const inactiveWorkerCount = allWorkers.filter(w => !w.is_active).length

  return (
    <div className="workers-container page">
      <div className="container">
        <h1 className="workers-header">👷 Workers</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {/* Top controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn btn-primary add-worker-btn"
            onClick={handleShowForm}
          >
            {showForm ? '✕ Cancel' : '+ Add Worker'}
          </button>

          {/* Search bar */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search by name, ID, phone..."
            />
          </div>

          {/* Job type filter */}
          <select
            className="job-type-filter"
            value={sortByJobType}
            onChange={(e) => {
              setSortByJobType(e.target.value)
              setSearchResults(null)
            }}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="All">All Job Types</option>
            {JOB_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Toggle inactive workers */}
          {inactiveWorkerCount > 0 && (
            <button
              className={`btn ${showInactiveWorkers ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => {
                setShowInactiveWorkers(!showInactiveWorkers)
                setSearchResults(null)
              }}
              title={showInactiveWorkers ? 'Show active workers' : 'Show inactive workers'}
            >
              {showInactiveWorkers ? '✓ Inactive' : '○ Inactive'} ({inactiveWorkerCount})
            </button>
          )}
        </div>

        {/* Add worker form */}
        {showForm && (
          <div className="card add-worker-form-card">
            <h2>Add New Worker</h2>
            <form onSubmit={handleAddWorker}>
              <div className="form-group">
                <label>Worker ID *</label>
                <input
                  type="text"
                  value={formData.worker_id}
                  onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                  placeholder="Auto-generated"
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <small>Auto-generated on form load</small>
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>

              <div className="form-group">
                <label>Job Type *</label>
                <select
                  value={formData.job_type}
                  onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                >
                  {JOB_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Add Worker
              </button>
            </form>
          </div>
        )}

        {/* Workers list header */}
        <h2 className="workers-list-header">
          {showInactiveWorkers
            ? `Inactive Workers (${displayWorkers.length})`
            : `Active Workers (${displayWorkers.length})`}
        </h2>

        {/* Workers list */}
        {loading ? (
          <div className="spinner"></div>
        ) : displayWorkers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>
            {showInactiveWorkers
              ? 'No inactive workers found.'
              : searchResults !== null
              ? 'No workers found matching your search.'
              : 'No workers found. Add one to get started!'}
          </p>
        ) : (
          <table className="workers-table">
            <thead>
              <tr>
                <th>Worker ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Job Type</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayWorkers.map((worker) => (
                <tr key={worker.id} style={{ opacity: worker.is_active ? 1 : 0.6 }}>
                  <td>
                    <button
                      onClick={() => handleViewIDCard(worker)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 'bold',
                        padding: 0
                      }}
                      title="Click to view ID card"
                    >
                      {worker.worker_id}
                    </button>
                  </td>
                  <td>{worker.name}</td>
                  <td>{worker.phone || '-'}</td>
                  <td>{worker.job_type}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {worker.is_active ? (
                        <>
                          <button
                            className="btn btn-small"
                            onClick={() => handleEditClick(worker)}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            title="Edit worker"
                          >
                            ✎ Edit
                          </button>
                          <button
                            className="btn btn-small"
                            onClick={() => handleDeactivateClick(worker)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: '#EF4444',
                              color: 'white',
                              border: 'none'
                            }}
                            title="Deactivate worker"
                          >
                            ✕ Deactivate
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-small"
                          onClick={() => handleActivateClick(worker)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#10B981',
                            color: 'white',
                            border: 'none'
                          }}
                          title="Activate worker"
                        >
                          ✓ Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingWorker && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setShowEditModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
          ></div>
          <div
            className="modal"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              zIndex: 1001,
              minWidth: '400px',
              maxWidth: '90%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Edit Worker</h3>

            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Worker name"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>

            <div className="form-group">
              <label>Job Type *</label>
              <select
                value={editFormData.job_type}
                onChange={(e) => setEditFormData({ ...editFormData, job_type: e.target.value })}
              >
                {JOB_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </>
      )}

      {/* Deactivate Modal */}
      <ConfirmReasonModal
        isOpen={showDeactivateModal}
        title="Deactivate Worker"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => {
          setShowDeactivateModal(false)
          setDeactivatingWorker(null)
        }}
      />

      {/* ID Card Popup */}
      <IDCardPopup
        isOpen={showCardPopup}
        worker={selectedWorkerForCard}
        onClose={() => {
          setShowCardPopup(false)
          setSelectedWorkerForCard(null)
        }}
      />
    </div>
  )
}

export default WorkersPage
