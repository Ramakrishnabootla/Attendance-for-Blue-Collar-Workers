import { useState, useEffect } from 'react'
import { fetchTodayAttendance } from '../../utils/api'
import { formatDateReadable, getTodayIndia, formatSecondsToHHMMSS, formatIndiaTimeWith12Hour } from '../../utils/timezoneHelper'
import './ContractorsPage.css'

function ContractorsPage() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Selected contractor for drill-down view
  const [selectedContractor, setSelectedContractor] = useState(null)

  useEffect(() => {
    loadContractorData()
  }, [])

  const loadContractorData = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchTodayAttendance()
      setAttendance(data.attendance || [])
    } catch (err) {
      setError('Failed to load contractor summaries')
    } finally {
      setLoading(false)
    }
  }

  // Pre-defined contractors list
  const CONTRACTORS = [
    { id: 'C001', name: 'ABC Contractors' },
    { id: 'C002', name: 'XYZ Builders' },
    { id: 'C003', name: 'Global Labour Co' },
    { id: 'C004', name: 'Elite Construction' }
  ]

  // Group workers and calculate contractor metrics
  const contractorSummaries = CONTRACTORS.map(contractor => {
    // Find all today's records for workers under this contractor
    // Note: If worker.contractor_id matches contractor.id (or defaults to C001)
    const contractorRecords = attendance.filter(record => {
      // In the database model, workers are returned with their contractor details joined.
      // E.g. record has record.contractor_id.
      // If none, default to C001.
      const cId = record.contractor_id || 'C001'
      return cId === contractor.id
    })

    const totalWorkers = contractorRecords.length
    const presentToday = contractorRecords.filter(r => r.status === 'Present').length
    const absentToday = contractorRecords.filter(r => r.status === 'Absent').length
    const totalSeconds = contractorRecords.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0)
    const totalHours = (totalSeconds / 3600).toFixed(1)
    const attendanceRate = totalWorkers > 0 ? Math.round((presentToday / totalWorkers) * 100) : 0

    return {
      ...contractor,
      totalWorkers,
      presentToday,
      absentToday,
      totalHours,
      attendanceRate,
      workers: contractorRecords
    }
  })

  // Calculate Overall Statistics
  const totalContractors = CONTRACTORS.length
  const totalForce = contractorSummaries.reduce((sum, c) => sum + c.totalWorkers, 0)
  const totalPresentToday = contractorSummaries.reduce((sum, c) => sum + c.presentToday, 0)
  const totalHoursWorked = contractorSummaries.reduce((sum, c) => sum + parseFloat(c.totalHours), 0).toFixed(1)

  const formatHours = (seconds, status) => {
    if (status !== 'Present') return '-'
    if (seconds === null || seconds === undefined) return 'Ongoing'
    return `${(seconds / 3600).toFixed(1)} hrs`
  }

  return (
    <div className="contractors-container page">
      <div className="container">
        <h1 className="contractors-header">💼 Contractor-wise Attendance View</h1>
        <p className="contractors-subheader">Real-time daily payment summaries and contractor metrics for {formatDateReadable(getTodayIndia())}</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats Row */}
        <div className="contractor-stats-row">
          <div className="contractor-stat-card card">
            <h3>{totalContractors}</h3>
            <p>Total Contractors</p>
          </div>
          <div className="contractor-stat-card card present-card">
            <h3>{totalPresentToday} / {totalForce}</h3>
            <p>Total Present Today</p>
          </div>
          <div className="contractor-stat-card card hours-card">
            <h3>{totalHoursWorked} hrs</h3>
            <p>Contractor Hours Today</p>
          </div>
          <div className="contractor-stat-card card percentage-card">
            <h3>{totalForce > 0 ? Math.round((totalPresentToday / totalForce) * 100) : 0}%</h3>
            <p>Overall Attendance Rate</p>
          </div>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="contractors-grid-layout">
            {/* Summary Table */}
            <div className="contractors-table-card card">
              <h3>📋 Contractor Summary List</h3>
              <div className="table-wrapper">
                <table className="contractors-table">
                  <thead>
                    <tr>
                      <th>Contractor ID</th>
                      <th>Contractor Name</th>
                      <th>Total Force</th>
                      <th>Present Today</th>
                      <th>Total Hours Worked</th>
                      <th>Attendance Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractorSummaries.map((summary) => (
                      <tr 
                        key={summary.id} 
                        className={`contractor-row-interactive ${selectedContractor?.id === summary.id ? 'active-row' : ''}`}
                        onClick={() => setSelectedContractor(summary)}
                      >
                        <td><strong>{summary.id}</strong></td>
                        <td>{summary.name}</td>
                        <td>{summary.totalWorkers}</td>
                        <td>
                          <span className={`status-pill ${summary.presentToday > 0 ? 'some-present' : 'none-present'}`}>
                            {summary.presentToday} Present
                          </span>
                        </td>
                        <td><strong>{summary.totalHours} hrs</strong></td>
                        <td>
                          <div className="attendance-bar-container">
                            <span className="rate-text">{summary.attendanceRate}%</span>
                            <div className="attendance-bar-outer">
                              <div 
                                className="attendance-bar-inner" 
                                style={{ 
                                  width: `${summary.attendanceRate}%`,
                                  backgroundColor: summary.attendanceRate > 75 ? 'var(--success-green)' : summary.attendanceRate > 40 ? 'var(--warning-yellow)' : 'var(--danger-red)'
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <button 
                            className={`btn ${selectedContractor?.id === summary.id ? 'btn-primary' : 'btn-outline'}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedContractor(summary)
                            }}
                          >
                            👁 View Workers
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Drill-down Worker Details list */}
            {selectedContractor && (
              <div className="contractor-detail-card card slide-in-animation">
                <div className="detail-header">
                  <div>
                    <h3>👷 Workers under: {selectedContractor.name}</h3>
                    <p className="subtext">{selectedContractor.totalWorkers} contracted workers registered ({selectedContractor.presentToday} present today)</p>
                  </div>
                  <button className="btn btn-secondary close-detail-btn" onClick={() => setSelectedContractor(null)}>
                    ✕ Close Panel
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="contractor-workers-table">
                    <thead>
                      <tr>
                        <th>Worker ID</th>
                        <th>Worker Name</th>
                        <th>Job Type</th>
                        <th>Status</th>
                        <th>Shift</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Hours Worked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedContractor.workers.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center' }}>No workers registered under this contractor yet.</td>
                        </tr>
                      ) : (
                        selectedContractor.workers.map((record) => {
                          const isPresent = record.status === 'Present'
                          return (
                            <tr key={record.worker_id} className={isPresent ? 'row-present-bg' : 'row-absent-bg'}>
                              <td><strong>{record.worker_id}</strong></td>
                              <td>{record.name}</td>
                              <td><span className="job-badge">{record.job_type}</span></td>
                              <td>
                                <span className={`status-badge ${isPresent ? 'status-present' : 'status-absent'}`}>
                                  {isPresent ? 'Present' : 'Absent'}
                                </span>
                              </td>
                              <td>{isPresent ? <span className="shift-pill">{record.shift_type || 'General'}</span> : '-'}</td>
                              <td>{record.check_in ? formatIndiaTimeWith12Hour(record.check_in) : '-'}</td>
                              <td>{record.check_out ? formatIndiaTimeWith12Hour(record.check_out) : '-'}</td>
                              <td><strong>{formatHours(record.time_spent_seconds, record.status)}</strong></td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContractorsPage
