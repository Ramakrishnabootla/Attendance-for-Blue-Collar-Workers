import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWorkerAttendance, fetchNotifications, dismissNotifications, fetchWorkerMLPrediction, fetchWorkerInsights } from '../../utils/api'
import { getTodayIndia, formatDateReadable, formatIndiaTimeWith12Hour, formatSecondsToHHMMSS } from '../../utils/timezoneHelper'
import './WorkerDashboardPage.css'

function WorkerDashboardPage({ worker, onLogout }) {
  const [history, setHistory] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('history')
  const [mlData, setMlData] = useState(null)
  const [loadingMl, setLoadingMl] = useState(false)
  const [aiInsights, setAiInsights] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (worker?.worker_id) {
      loadWorkerHistory()
      loadWorkerNotifications()
      loadWorkerMLData()
      loadWorkerAIInsights()
    }
  }, [worker])


  const loadWorkerNotifications = async () => {
    try {
      const data = await fetchNotifications(worker.worker_id)
      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  const loadWorkerMLData = async () => {
    try {
      setLoadingMl(true)
      const data = await fetchWorkerMLPrediction(worker.worker_id)
      if (data.success) {
        setMlData(data)
      }
    } catch (err) {
      console.error('Failed to load ML prediction:', err)
    } finally {
      setLoadingMl(false)
    }
  }

  const loadWorkerAIInsights = async () => {
    try {
      const data = await fetchWorkerInsights(worker.worker_id)
      if (data.success) {
        setAiInsights(data)
      }
    } catch (err) {
      console.error('Failed to load AI insights:', err)
    }
  }

  const handleDismissNotifications = async () => {
    try {
      const data = await dismissNotifications(worker.worker_id)
      if (data.success) {
        setNotifications([])
      }
    } catch (err) {
      console.error('Failed to dismiss notifications:', err)
    }
  }

  const loadWorkerHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchWorkerAttendance(worker.worker_id)
      if (data.success) {
        setHistory(data.attendance || [])
      } else {
        setError(data.error || 'Failed to load attendance history')
      }
    } catch (err) {
      setError('Connection error - Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutClick = () => {
    onLogout()
    navigate('/login')
  }

  // Get Today's record if present
  const todayDateStr = getTodayIndia()
  const todayRecord = history.find(r => r.date === todayDateStr)

  // Calculate statistics from history
  const totalDays = history.length
  const presentDays = history.filter(r => r.status === 'Present').length
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
  const totalSeconds = history.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0)
  const totalHours = (totalSeconds / 3600).toFixed(1)

  const formatHours = (seconds, status) => {
    if (status !== 'Present') return '-'
    if (seconds === null || seconds === undefined) return 'Ongoing'
    return `${(seconds / 3600).toFixed(1)} hrs`
  }

  return (
    <div className="worker-dashboard page">
      <div className="container">
        {/* Notifications Widget */}
        {notifications.length > 0 && (
          <div className="notifications-alert-banner">
            <div className="notifications-banner-header">
              <span className="bell-icon">🔔</span>
              <span className="bell-badge">{notifications.length}</span>
              <h3>New Profile & Attendance Alerts</h3>
              <button className="btn-dismiss-all" onClick={handleDismissNotifications}>
                Dismiss All ✓
              </button>
            </div>
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div key={notif.id} className={`notification-item notif-${notif.type}`}>
                  <p className="notif-message">{notif.message}</p>
                  <span className="notif-time">
                    {new Date(notif.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worker Header Card */}
        <div className="worker-profile-card card">
          <div className="worker-profile-header">
            <div className="worker-avatar">👷</div>
            <div className="worker-meta">
              <h2>{worker?.name}</h2>
              <p className="worker-badge">{worker?.job_type}</p>
            </div>
            <button className="btn btn-danger logout-header-btn" onClick={handleLogoutClick}>
              🚪 Logout
            </button>
          </div>
          <div className="worker-profile-grid">
            <div className="profile-item">
              <span className="profile-label">Worker ID</span>
              <span className="profile-value">{worker?.worker_id}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Contractor</span>
              <span className="profile-value">{worker?.contractor_name || 'General Contractors'}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Registered Phone</span>
              <span className="profile-value">{worker?.phone || 'Not Registered'}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="worker-stats-row">
          <div className="worker-stat-card card">
            <h3>{presentDays} / {totalDays}</h3>
            <p>Days Present</p>
          </div>
          <div className="worker-stat-card card rate-card">
            <h3>{attendanceRate}%</h3>
            <p>Attendance Rate</p>
          </div>
          <div className="worker-stat-card card hours-card">
            <h3>{totalHours} hrs</h3>
            <p>Total Hours Worked</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="worker-tabs-container">
          <button 
            className={`worker-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📅 Today & History
          </button>
          <button 
            className={`worker-tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            📊 AI Behavior Analysis
          </button>
        </div>

        {activeTab === 'history' ? (
          <>
            {/* Today's Status Widget */}
            <div className="today-status-card card">
              <h3>📅 Today's Status ({formatDateReadable(todayDateStr)})</h3>
              {todayRecord ? (
                <div className="today-status-details">
                  <div className="status-badge-row">
                    <span className={`status-badge ${todayRecord.status === 'Present' ? 'status-present' : 'status-absent'}`}>
                      {todayRecord.status === 'Present' ? '✓ Present' : '✗ Absent'}
                    </span>
                    {todayRecord.status === 'Present' && (
                      <span className="shift-badge">{todayRecord.shift_type || 'General'} Shift</span>
                    )}
                  </div>

                  {todayRecord.status === 'Present' ? (
                    <div className="today-times-grid">
                      <div className="time-box">
                        <span className="time-label">Check-In</span>
                        <span className="time-val">{todayRecord.check_in ? formatIndiaTimeWith12Hour(todayRecord.check_in) : '--:--'}</span>
                      </div>
                      <div className="time-box">
                        <span className="time-label">Check-Out</span>
                        <span className="time-val">{todayRecord.check_out ? formatIndiaTimeWith12Hour(todayRecord.check_out) : '--:--'}</span>
                      </div>
                      <div className="time-box">
                        <span className="time-label">Hours Worked</span>
                        <span className="time-val hours-val">{formatHours(todayRecord.time_spent_seconds, todayRecord.status)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="absent-reason-msg">
                      Reason for Absence: <strong>{todayRecord.absence_reason || 'Not specified'}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <p className="no-status-yet">⏳ Your attendance has not been marked by the supervisor yet today.</p>
              )}
            </div>

            {/* Attendance History Section */}
            <div className="worker-history-section card">
              <h3>📋 My Attendance Log</h3>
              {loading ? (
                <div className="spinner"></div>
              ) : error ? (
                <div className="alert alert-error">{error}</div>
              ) : history.length === 0 ? (
                <p className="no-records">No past attendance logs found.</p>
              ) : (
                <div className="worker-history-list">
                  {history.map((record, index) => {
                    const isPresent = record.status === 'Present'
                    return (
                      <div className={`history-log-row ${isPresent ? 'present-row' : 'absent-row'}`} key={index}>
                        <div className="log-date-col">
                          <strong>{formatDateReadable(record.date)}</strong>
                          <span className="log-shift">{record.shift_type || 'General'} Shift</span>
                        </div>

                        <div className="log-status-col">
                          <span className={`status-badge ${isPresent ? 'status-present' : 'status-absent'}`}>
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                        </div>

                        {isPresent ? (
                          <div className="log-times-col">
                            <div className="log-time-item">
                              <span>In:</span> <strong>{record.check_in ? formatIndiaTimeWith12Hour(record.check_in) : '--:--'}</strong>
                            </div>
                            <div className="log-time-item">
                              <span>Out:</span> <strong>{record.check_out ? formatIndiaTimeWith12Hour(record.check_out) : '--:--'}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="log-reason-col">
                            Reason: <span>{record.absence_reason || 'N/A'}</span>
                          </div>
                        )}

                        <div className="log-hours-col">
                          <span className="hours-badge">
                            {formatHours(record.time_spent_seconds, record.status)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="analysis-tab-wrapper">
            {loadingMl ? (
              <div className="spinner" style={{ margin: '40px auto' }}></div>
            ) : !mlData ? (
              <div className="analysis-locked-card card">
                <span className="locked-icon">⏳</span>
                <h3>Connecting to AI Engine...</h3>
                <p>Establishing secure connection to Scikit-Learn prediction environment...</p>
              </div>
            ) : mlData.insufficient ? (
              <div className="analysis-locked-card card">
                <span className="locked-icon">🔒</span>
                <h3>AI Behavioral Analysis Compiling</h3>
                <p>
                  AI scheduling models and absence risk profiles are currently locked for this profile.
                  Our classification engine requires at least <strong>7 days</strong> of active attendance history to calibrate your baseline habits.
                </p>
                <div style={{ marginTop: '20px', display: 'inline-block', background: '#F3F4F6', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', color: '#4B5563' }}>
                  📈 Progress: {mlData.days_recorded} / 7 Days Tracked
                </div>
                <p style={{ marginTop: '15px', fontSize: '13px', color: '#6B7280' }}>
                  Please keep checking in consistently to unlock your custom behavior dashboard!
                </p>
              </div>
            ) : (
                  <>
                    {/* Gen AI Insights */}
                    {aiInsights && aiInsights.insights && (
                      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
                        <h3 style={{ color: '#166534', marginBottom: '10px' }}>🤖 Generative AI Performance Insight</h3>
                        <p style={{ color: '#15803d', fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>
                          {aiInsights.insights}
                        </p>
                      </div>
                    )}

                    {/* Insights Hero Banner */}
                    <div className="ml-insights-hero">
                      <div className="hero-left">
                        <h3>
                          {mlData.prediction.category === 'Regular' && '✨ Outstanding Attendance Profile'}
                          {mlData.prediction.category === 'Irregular' && '⚠️ Shift Adherence Coaching'}
                          {mlData.prediction.category === 'High_Risk' && '🚨 Critical Absence Alert'}
                        </h3>
                        <p>
                          Our Scikit-Learn Random Forest model analyzes your trailing 30-day punctuality, late arrivals, shift gaps, and total duration to score your scheduling consistency.
                        </p>
                        {mlData.calculated_at && (
                          <p style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600' }}>
                            📊 AI analysis computed by supervisor on {formatDateReadable(mlData.calculated_at.split('T')[0])}
                          </p>
                        )}
                      </div>
                      <div className="hero-badge-liveness">
                        <span className="pulse-dot"></span> ML Profile Calibrated
                      </div>
                    </div>

                    {/* Visual ML Widgets Grid (No Tables) */}
                    <div className="ml-dashboard">
                      {/* Metric Circle Indicator */}
                      <div className="ml-card-main card">
                        <div className="ml-badge-container">
                          <span className="ml-badge-large" style={{ 
                            backgroundColor: mlData.prediction.category === 'Regular' ? '#E6F4EA' : mlData.prediction.category === 'Irregular' ? '#FFF3E0' : '#FFEBEE',
                            color: mlData.prediction.category === 'Regular' ? '#137333' : mlData.prediction.category === 'Irregular' ? '#E65100' : '#C62828'
                          }}>
                            {mlData.prediction.category === 'Regular' && 'Regular Worker'}
                            {mlData.prediction.category === 'Irregular' && 'Irregular Attendance'}
                            {mlData.prediction.category === 'High_Risk' && 'High Absence Risk'}
                          </span>
                        </div>

                        {/* Circular Progress Gauge */}
                        <div className="ml-confidence-gauge" style={{
                          background: `conic-gradient(${
                            mlData.prediction.category === 'Regular' ? '#10B981' : mlData.prediction.category === 'Irregular' ? '#F59E0B' : '#EF4444'
                          } 0% ${Math.round(mlData.prediction.confidence * 100)}%, #E4E4E7 ${Math.round(mlData.prediction.confidence * 100)}% 100%)`
                        }}>
                          <div className="gauge-text">
                            <span className="gauge-percentage">{Math.round(mlData.prediction.confidence * 100)}%</span>
                            <span className="gauge-label">Confidence</span>
                          </div>
                        </div>

                        {/* Risk Bar Slider */}
                        <div className="ml-risk-thermometer">
                          <div className="thermo-header">
                            <span>Attendance Risk</span>
                            <span style={{ 
                              color: mlData.prediction.risk_level === 'LOW' ? '#10B981' : mlData.prediction.risk_level === 'MEDIUM' ? '#F59E0B' : '#EF4444'
                            }}>{mlData.prediction.risk_level}</span>
                          </div>
                          <div className="thermo-bar-bg">
                            <div className="thermo-bar-fill" style={{ 
                              width: mlData.prediction.risk_level === 'LOW' ? '15%' : mlData.prediction.risk_level === 'MEDIUM' ? '55%' : '90%',
                              background: mlData.prediction.risk_level === 'LOW' ? '#10B981' : mlData.prediction.risk_level === 'MEDIUM' ? '#F59E0B' : '#EF4444'
                            }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Coaching and Actionable Recommendations */}
                      <div className="ml-card-coaching card">
                        <h3>💡 AI Scheduling & Growth Coaching</h3>
                        <div className="coaching-tips-list">
                          {mlData.prediction.recommendations && mlData.prediction.recommendations.map((rec, i) => (
                            <div className="coaching-tip-item" key={i}>
                              <span className="tip-number">{i + 1}</span>
                              <p className="tip-content">{rec}</p>
                            </div>
                          ))}
                          {(!mlData.prediction.recommendations || mlData.prediction.recommendations.length === 0) && (
                            <>
                              <div className="coaching-tip-item">
                                <span className="tip-number">1</span>
                                <p className="tip-content"><strong>Keep punctuality high:</strong> Try to check in before 9:00 AM for morning shifts.</p>
                              </div>
                              <div className="coaching-tip-item">
                                <span className="tip-number">2</span>
                                <p className="tip-content"><strong>Bonus eligibility:</strong> You are fully qualified for the consistent worker monthly reward incentive!</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkerDashboardPage

