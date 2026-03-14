import { useState, useEffect } from 'react'
import { fetchWorkers, createWorker } from '../../utils/api'
import './WorkersPage.css'

function WorkersPage() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    worker_id: '',
    name: '',
    phone: '',
    job_type: 'Construction'
  })

  // Fetch workers
  useEffect(() => {
    loadWorkers()
  }, [])

  const loadWorkers = async () => {
    try {
      setLoading(true)
      const data = await fetchWorkers()
      setWorkers(data.workers || [])
    } catch (err) {
      setError('Failed to load workers')
    } finally {
      setLoading(false)
    }
  }

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
        loadWorkers()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.error || 'Failed to add worker')
      }
    } catch (err) {
      setError('Connection error')
    }
  }

  return (
    <div className="workers-container page">
      <div className="container">
        <h1 className="workers-header">👷 Workers</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <button
          className="btn btn-primary add-worker-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Worker'}
        </button>

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
                  placeholder="W001"
                />
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
                  <option value="Construction">Construction</option>
                  <option value="Factory">Factory</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Contract Labour">Contract Labour</option>
                  <option value="Daily Wage">Daily Wage</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Add Worker
              </button>
            </form>
          </div>
        )}

        <h2 className="workers-list-header">All Workers ({workers.length})</h2>

        {loading ? (
          <div className="spinner"></div>
        ) : workers.length === 0 ? (
          <p>No workers found. Add one to get started!</p>
        ) : (
          <table className="workers-table">
            <thead>
              <tr>
                <th>Worker ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Job Type</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td><strong className="worker-id-strong">{worker.worker_id}</strong></td>
                  <td>{worker.name}</td>
                  <td>{worker.phone || '-'}</td>
                  <td>{worker.job_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default WorkersPage
