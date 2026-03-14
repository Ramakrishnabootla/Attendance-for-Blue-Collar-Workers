import { useState, useEffect } from 'react'
import { fetchTodayAttendance, bulkMarkAttendance } from '../../utils/api'
import { getIndiaTimeNow, formatIndiaTimeWith12Hour, getTodayIndia, formatSecondsToHHMMSS, formatDateReadable, convert12To24 } from '../../utils/timezoneHelper'
import ConfirmReasonModal from '../../components/ConfirmReasonModal'
import SearchBar from '../../components/SearchBar'
import './AttendanceMarkingPage.css'

function AttendanceMarkingPage() {
  const [workers, setWorkers] = useState([])
  const [filteredWorkers, setFilteredWorkers] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [selectedWorkerId, setSelectedWorkerId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch workers and today's attendance
  useEffect(() => {
    loadAttendance()
  }, [])

  // Filter workers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWorkers(workers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = workers.filter(
      w => w.worker_id.toLowerCase().includes(query) ||
           w.name.toLowerCase().includes(query) ||
           w.phone?.toLowerCase().includes(query)
    )
    setFilteredWorkers(filtered)
  }, [searchQuery, workers])

  const loadAttendance = async () => {
    try {
      setLoading(true)
      const data = await fetchTodayAttendance()

      setWorkers(data.attendance || [])
      setFilteredWorkers(data.attendance || [])

      // Initialize attendance state
      const attendanceState = {}
      data.attendance.forEach((record) => {
        attendanceState[record.worker_id] = {
          status: record.status,
          check_in: record.check_in ? formatIndiaTimeWith12Hour(record.check_in) : null,
          check_out: record.check_out ? formatIndiaTimeWith12Hour(record.check_out) : null,
          time_spent_seconds: record.time_spent_seconds || null,
          absence_reason: record.absence_reason || null
        }
      })
      setAttendance(attendanceState)
    } catch (err) {
      setError('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
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
            [worker_id]: { ...current, check_out: getIndiaTimeNow() }
          }
        }
        // If already has checkout, do nothing (no toggle to absent)
        return prev
      } else {
        // Mark as present with check-in time
        return {
          ...prev,
          [worker_id]: { status: 'Present', check_in: getIndiaTimeNow(), check_out: null, time_spent_seconds: null, absence_reason: null }
        }
      }
    })
  }

  const markAbsent = (worker_id) => {
    setSelectedWorkerId(worker_id)
    setShowReasonModal(true)
  }

  const handleReasonConfirm = (reason) => {
    setAttendance((prev) => ({
      ...prev,
      [selectedWorkerId]: { status: 'Absent', check_in: null, check_out: null, time_spent_seconds: null, absence_reason: reason }
    }))
    setShowReasonModal(false)
    setSelectedWorkerId(null)
  }

  const handleReasonCancel = () => {
    setShowReasonModal(false)
    setSelectedWorkerId(null)
  }

  const handleSubmit = async () => {
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      // Convert attendance state to API format
      const records = workers.map((worker) => {
        const att = attendance[worker.worker_id]

        // Convert 12-hour format to 24-hour format for submission
        const checkIn24 = att?.check_in ? convert12To24(att.check_in) : null
        const checkOut24 = att?.check_out ? convert12To24(att.check_out) : null

        const record = {
          worker_id: worker.worker_id,
          status: att?.status || 'Absent',
          check_in: checkIn24 ? `${getTodayIndia()} ${checkIn24}:00` : null,
          check_out: checkOut24 ? `${getTodayIndia()} ${checkOut24}:00` : null
        }

        // Include absence_reason only if Absent
        if (att?.status === 'Absent' && att?.absence_reason) {
          record.absence_reason = att.absence_reason
        }

        return record
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
        <h1 className="attendance-header">📋 Mark Today's Attendance - {formatDateReadable(getTodayIndia())}</h1>

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

        {/* Search Bar */}
        {!loading && workers.length > 0 && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by Worker ID, Name, or Phone..."
          />
        )}

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
                    <th>Time Spent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center' }}>No workers found matching your search</td>
                    </tr>
                  ) : (
                    filteredWorkers.map((worker) => {
                    const att = attendance[worker.worker_id]
                    const isPresent = att?.status === 'Present'
                    const hasCheckOut = !!att?.check_out
                    const timeSpent = att?.time_spent_seconds ? formatSecondsToHHMMSS(att.time_spent_seconds) : '-'

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
                        <td>{timeSpent}</td>
                        <td>
                          <div className="action-buttons">
                            {isPresent && !hasCheckOut ? (
                              // Present without checkout - show Check Out button only
                              <button
                                className="btn btn-primary action-btn-present"
                                onClick={() => togglePresent(worker.worker_id)}
                                disabled={submitting}
                              >
                                Check Out
                              </button>
                            ) : isPresent && hasCheckOut ? (
                              // Present with checkout complete - show Mark Absent button to toggle
                              <button
                                className="btn btn-danger action-btn-absent"
                                onClick={() => markAbsent(worker.worker_id)}
                                disabled={submitting}
                              >
                                Mark Absent
                              </button>
                            ) : (
                              // Absent - show Mark Present button to toggle
                              <button
                                className="btn btn-primary action-btn-present"
                                onClick={() => togglePresent(worker.worker_id)}
                                disabled={submitting}
                              >
                                Mark Present
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                  )}
                </tbody>
              </table>
            </div>

            <ConfirmReasonModal
              isOpen={showReasonModal}
              title="Mark Absent - Select Reason"
              onConfirm={handleReasonConfirm}
              onCancel={handleReasonCancel}
            />

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
