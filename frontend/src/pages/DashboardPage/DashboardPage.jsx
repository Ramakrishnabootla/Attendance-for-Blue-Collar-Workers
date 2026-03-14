import { useState, useEffect } from 'react'
import { fetchTodayAttendance } from '../../utils/api'
import './DashboardPage.css'

function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getTodayFormatted = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date().toLocaleDateString('en-US', options)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const dashboardData = await fetchTodayAttendance()
      setData(dashboardData)
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container page">
        <div className="container">
          <div className="alert alert-error">{error}</div>
        </div>
      </div>
    )
  }

  const summary = data?.summary || { total_workers: 0, present_today: 0, absent_today: 0 }
  const attendance = data?.attendance || []

  // Calculate percentages
  const presentPercentage =
    summary.total_workers > 0
      ? Math.round((summary.present_today / summary.total_workers) * 100)
      : 0

  return (
    <div className="dashboard-container page">
      <div className="container">
        <h1 className="dashboard-header">📊 Attendance Dashboard - {getTodayFormatted()}</h1>

        {/* Summary Cards */}
        <div className="dashboard-summary-row">
          <div className="dashboard-card">
            <h3>{summary.total_workers}</h3>
            <p>Total Workers</p>
          </div>
          <div className="dashboard-card present">
            <h3>{summary.present_today}</h3>
            <p>Present Today</p>
          </div>
          <div className="dashboard-card absent">
            <h3>{summary.absent_today}</h3>
            <p>Absent Today</p>
          </div>
          <div className="dashboard-card percentage">
            <h3>{presentPercentage}%</h3>
            <p>Attendance Rate</p>
          </div>
          <div className="dashboard-card">
          <button
          className="btn btn-secondary dashboard-refresh-btn"
          onClick={loadDashboard}
        >
          🔄 Refresh
        </button>
        </div>
        </div>

        {/* Attendance Table */}
        <h2 className="dashboard-attendance-header">Today's Attendance Details</h2>

        {attendance.length === 0 ? (
          <p>No attendance records for today.</p>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Worker ID</th>
                  <th>Name</th>
                  <th>Job Type</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.worker_id}>
                    <td><strong className="dashboard-worker-id">{record.worker_id}</strong></td>
                    <td>{record.name}</td>
                    <td>{record.job_type}</td>
                    <td>
                      {record.check_in
                        ? new Date(record.check_in).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </td>
                    <td>
                      {record.check_out
                        ? new Date(record.check_out).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </td>
                    <td>
                      <span
                        className={`dashboard-status-badge ${
                          record.status === 'Present' ? 'present' : 'absent'
                        }`}
                      >
                        {record.status === 'Present' ? '✓ Present' : '✗ Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        
      </div>
    </div>
  )
}

export default DashboardPage
