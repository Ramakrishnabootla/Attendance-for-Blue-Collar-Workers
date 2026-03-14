import { useState, useEffect } from 'react'
import { fetchTodayAttendance, bulkMarkAttendance } from '../../utils/api'
import './AttendanceMarkingPage.css'

function AttendanceMarkingPage() {
  const [workers, setWorkers] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Get today's date
  const getToday = () => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  const getTodayFormatted = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date().toLocaleDateString('en-US', options)
  }

  // Fetch workers and today's attendance
  useEffect(() => {
    loadAttendance()
  }, [])

  const loadAttendance = async () => {
    try {
      setLoading(true)
      const data = await fetchTodayAttendance()

      setWorkers(data.attendance || [])

      // Initialize attendance state
      const attendanceState = {}
      data.attendance.forEach((record) => {
        attendanceState[record.worker_id] = {
          status: record.status,
          check_in: record.check_in ? record.check_in.substring(11, 16) : null,
          check_out: record.check_out ? record.check_out.substring(11, 16) : null
        }
      })
      setAttendance(attendanceState)
    } catch (err) {
      setError('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentTime = () => {
    const now = new Date()
    return now.toTimeString().substring(0, 5) // HH:MM format
  }

  const togglePresent = (worker_id) => {
    setAttendance((prev) => {
      const current = prev[worker_id]
      const isCurrentlyPresent = current?.status === 'Present'

      if (isCurrentlyPresent) {
        // Already present - if no checkout, set it now
        if (!current.check_out) {
          return {
            ...prev,
            [worker_id]: { ...current, check_out: getCurrentTime() }
          }
        } else {
          // Already has checkout, toggle back to absent
          return {
            ...prev,
            [worker_id]: { status: 'Absent', check_in: null, check_out: null }
          }
        }
      } else {
        // Mark as present with check-in time
        return {
          ...prev,
          [worker_id]: { status: 'Present', check_in: getCurrentTime(), check_out: null }
        }
      }
    })
  }

  const markAbsent = (worker_id) => {
    setAttendance((prev) => ({
      ...prev,
      [worker_id]: { status: 'Absent', check_in: null, check_out: null }
    }))
  }

  const handleSubmit = async () => {
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      // Convert attendance state to API format
      const records = workers.map((worker) => {
        const att = attendance[worker.worker_id]
        return {
          worker_id: worker.worker_id,
          status: att?.status || 'Absent',
          check_in: att?.check_in ? `${getToday()} ${att.check_in}:00` : null,
          check_out: att?.check_out ? `${getToday()} ${att.check_out}:00` : null
        }
      })

      const data = await bulkMarkAttendance(records)

      if (data.success) {
        setMessage('✓ Attendance submitted successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.error || 'Failed to submit')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  const getPresentCount = () => {
    return Object.values(attendance).filter(a => a?.status === 'Present').length
  }

  const getAbsentCount = () => {
    return Object.values(attendance).filter(a => a?.status === 'Absent').length
  }

  return (
    <div className="attendance-container page">
      <div className="container">
        <h1 className="attendance-header">📋 Mark Today's Attendance - {getTodayFormatted()}</h1>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {/* Summary */}
        <div className="summary-row">
          <div className="summary-card">
            <h3>{workers.length}</h3>
            <p>Total Workers</p>
          </div>
          <div className="summary-card present-card">
            <h3>{getPresentCount()}</h3>
            <p>Present Today</p>
          </div>
          <div className="summary-card absent-card">
            <h3>{getAbsentCount()}</h3>
            <p>Absent Today</p>
          </div>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : workers.length === 0 ? (
          <p>No workers to mark. Add workers first!</p>
        ) : (
          <>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Worker ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => {
                    const att = attendance[worker.worker_id]
                    const isPresent = att?.status === 'Present'

                    return (
                      <tr key={worker.worker_id}>
                        <td><strong className="worker-id-strong">{worker.worker_id}</strong></td>
                        <td>{worker.name}</td>
                        <td>
                          <span className={`status-badge ${isPresent ? 'status-present' : 'status-absent'}`}>
                            {isPresent ? '✓ Present' : '✗ Absent'}
                          </span>
                        </td>
                        <td>{att?.check_in || '-'}</td>
                        <td>{att?.check_out || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-primary action-btn-present"
                              onClick={() => togglePresent(worker.worker_id)}
                              disabled={submitting}
                            >
                              {isPresent && att?.check_out ? '✓ Done' : isPresent ? 'Check Out' : 'Present'}
                            </button>
                            <button
                              className="btn btn-danger action-btn-absent"
                              onClick={() => markAbsent(worker.worker_id)}
                              disabled={submitting}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <button
              className="btn btn-primary submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '⏳ Submitting...' : '✓ Submit All'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default AttendanceMarkingPage
