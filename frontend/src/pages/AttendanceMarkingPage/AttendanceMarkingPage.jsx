import { useState, useEffect } from 'react'
import { fetchTodayAttendance, bulkMarkAttendance } from '../../utils/api'
import { getIndiaTimeNow, formatIndiaTimeWith12Hour, getTodayIndia, formatSecondsToHHMMSS, formatDateReadable, convert12To24, detectShiftType } from '../../utils/timezoneHelper'
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
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('All')

  // Fetch workers and today's attendance
  useEffect(() => {
    loadAttendance()
  }, [])

  // Filter workers based on search query and shift filter
  useEffect(() => {
    let result = workers

    // Filter by shift
    if (selectedShiftFilter !== 'All') {
      result = result.filter(w => {
        const att = attendance[w.worker_id]
        return att?.status === 'Present' && att?.shift_type === selectedShiftFilter
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        w => w.worker_id.toLowerCase().includes(query) ||
             w.name.toLowerCase().includes(query) ||
             w.phone?.toLowerCase().includes(query)
      )
    }

    setFilteredWorkers(result)
  }, [searchQuery, selectedShiftFilter, workers, attendance])

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
          absence_reason: record.absence_reason || null,
          shift_type: record.shift_type || 'General'
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
        const checkInTime = getIndiaTimeNow()
        const autoShift = detectShiftType(checkInTime)
        return {
          ...prev,
          [worker_id]: { status: 'Present', check_in: checkInTime, check_out: null, time_spent_seconds: null, absence_reason: null, shift_type: autoShift }
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
          check_out: checkOut24 ? `${getTodayIndia()} ${checkOut24}:00` : null,
          shift_type: att?.shift_type || 'General'
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

        {/* Search Bar & Shift Filter */}
        {!loading && workers.length > 0 && (
          <div className="search-filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by Worker ID, Name, or Phone..."
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <select
                value={selectedShiftFilter}
                onChange={(e) => setSelectedShiftFilter(e.target.value)}
                style={{
                  height: '46px',
                  borderRadius: '10px',
                  border: '2px solid var(--border-light)',
                  padding: '0 12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-medium)',
                  backgroundColor: 'white',
                  width: '100%',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Shifts</option>
                <option value="General">General Shift</option>
                <option value="Morning">Morning Shift</option>
                <option value="Evening">Evening Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>
          </div>
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
                    <th>Shift</th>
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
                        <td>
                          {isPresent ? (
                            <select
                              value={att?.shift_type || 'General'}
                              onChange={(e) => {
                                const val = e.target.value
                                setAttendance(prev => ({
                                  ...prev,
                                  [worker.worker_id]: { ...prev[worker.worker_id], shift_type: val }
                                }))
                              }}
                              className="shift-select"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                fontSize: '13px',
                                fontWeight: '600',
                                width: '100%',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="General">General</option>
                              <option value="Morning">Morning</option>
                              <option value="Evening">Evening</option>
                              <option value="Night">Night</option>
                            </select>
                          ) : '-'}
                        </td>
                        <td>{att?.check_in || '-'}</td>
                        <td>{att?.check_out || '-'}</td>
                        <td>{timeSpent}</td>
                        <td>
                          <div className="action-buttons">
                            {isPresent && !hasCheckOut ? (
                              // Present without checkout - show both Check Out and Mark Absent
                              <>
                                <button
                                  className="btn btn-primary action-btn-present"
                                  onClick={() => togglePresent(worker.worker_id)}
                                  disabled={submitting}
                                >
                                  Check Out
                                </button>
                                <button
                                  className="btn btn-danger action-btn-absent"
                                  onClick={() => markAbsent(worker.worker_id)}
                                  disabled={submitting}
                                >
                                  Mark Absent
                                </button>
                              </>
                            ) : isPresent && hasCheckOut ? (
                              // Present with checkout complete - attendance completed, no changes allowed
                              <button
                                className="btn btn-success action-btn-completed"
                                disabled={true}
                              >
                                ✓ Completed
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
