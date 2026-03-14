import { useState, useEffect } from 'react'
import { fetchTodayAttendance, getAttendanceByDateRange } from '../../utils/api'
import { getTodayIndia, formatDateReadable, formatSecondsToHHMMSS } from '../../utils/timezoneHelper'
import SearchBar from '../../components/SearchBar'
import DateRangeSelector from '../../components/DateRangeSelector'
import './DashboardPage.css'

function DashboardPage() {
  const [data, setData] = useState(null)
  const [filteredData, setFilteredData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateLoading, setDateLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDateSelector, setShowDateSelector] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getTodayIndia())
  const [searchQuery, setSearchQuery] = useState('')

  const getTodayFormatted = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date().toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const dashboardData = await fetchTodayAttendance()
      setData(dashboardData)
      setFilteredData(dashboardData)
      setSelectedDate(getTodayIndia())
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = async (date) => {
    try {
      setDateLoading(true)
      setSelectedDate(date)
      setShowDateSelector(false)

      // Fetch attendance for selected date and workers created on that date
      const response = await getAttendanceByDateRange(date, date)

      if (response.success) {
        setFilteredData({
          ...response,
          attendance: response.attendance || [],
          summary: {
            total_workers: response.workers.length,
            present_today: (response.attendance || []).filter(r => r.status === 'Present').length,
            absent_today: (response.attendance || []).filter(r => r.status === 'Absent').length
          }
        })
        setError('')
      } else {
        setError('Failed to load date data')
      }
    } catch (err) {
      setError('Failed to load attendance for selected date')
    } finally {
      setDateLoading(false)
    }
  }

  const handleSearchResults = (results) => {
    if (results && results.length > 0) {
      // Filter attendance records to only show matched workers
      const matchedWorkerIds = results.map(w => w.worker_id)
      const filtered = (data?.attendance || []).filter(
        att => matchedWorkerIds.includes(att.worker_id)
      )

      setFilteredData({
        ...data,
        attendance: filtered,
        summary: {
          total_workers: results.length,
          present_today: filtered.filter(r => r.status === 'Present').length,
          absent_today: filtered.filter(r => r.status === 'Absent').length
        }
      })
      setSearchQuery(results.map(w => w.worker_id).join(', '))
    } else {
      setFilteredData(data)
      setSearchQuery('')
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="dashboard-container page">
        <div className="container">
          <div className="alert alert-error">{error}</div>
        </div>
      </div>
    )
  }

  const summary = filteredData?.summary || { total_workers: 0, present_today: 0, absent_today: 0 }
  const attendance = filteredData?.attendance || []

  // Calculate percentages
  const presentPercentage =
    summary.total_workers > 0
      ? Math.round((summary.present_today / summary.total_workers) * 100)
      : 0

  const isFilteredDate = selectedDate !== getTodayIndia()

  return (
    <div className="dashboard-container page">
      <div className="container">
        <h1 className="dashboard-header">
          📊 Attendance Dashboard - {isFilteredDate ? formatDateReadable(selectedDate) : getTodayFormatted()}
        </h1>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Control Bar */}
        <div className="dashboard-controls">
          <div className="dashboard-control-item">
            <SearchBar onSearch={handleSearchResults} placeholder="Search workers..." />
          </div>

          <button
            className={`btn ${isFilteredDate ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowDateSelector(!showDateSelector)}
          >
            📅 {isFilteredDate ? 'Change Date' : 'Select Date'}
          </button>

          {isFilteredDate && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedDate(getTodayIndia())
                loadDashboard()
              }}
            >
              ← Today
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={loadDashboard}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Date Selector Modal */}
        {showDateSelector && (
          <div className="dashboard-date-selector-wrapper">
            <DateRangeSelector
              onDateSelect={handleDateSelect}
              onCancel={() => setShowDateSelector(false)}
            />
          </div>
        )}

        {/* Summary Cards */}
        <div className="dashboard-summary-row">
          <div className="dashboard-card">
            <h3>{summary.total_workers}</h3>
            <p>Total{isFilteredDate ? ' (Created)' : ' Workers'}</p>
          </div>
          <div className="dashboard-card present">
            <h3>{summary.present_today}</h3>
            <p>Present</p>
          </div>
          <div className="dashboard-card absent">
            <h3>{summary.absent_today}</h3>
            <p>Absent</p>
          </div>
          <div className="dashboard-card percentage">
            <h3>{presentPercentage}%</h3>
            <p>Attendance Rate</p>
          </div>
        </div>

        {/* Attendance Table */}
        <h2 className="dashboard-attendance-header">
          {isFilteredDate ? `Workers Created on ${formatDateReadable(selectedDate)}` : "Today's Attendance Details"}
        </h2>

        {attendance.length === 0 ? (
          <p className="no-records">No attendance records {isFilteredDate ? 'for this date' : 'for today'}.</p>
        ) : (
          <div className="dashboard-table-wrapper" style={{ position: 'relative', opacity: dateLoading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
            {dateLoading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
              </div>
            )}
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Worker ID</th>
                  <th>Name</th>
                  <th>Job Type</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Time Spent</th>
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
                        ? new Date(record.check_in).toLocaleTimeString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })
                        : '-'}
                    </td>
                    <td>
                      {record.check_out
                        ? new Date(record.check_out).toLocaleTimeString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })
                        : '-'}
                    </td>
                    <td>
                      {record.time_spent_seconds ? formatSecondsToHHMMSS(record.time_spent_seconds) : '-'}
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
