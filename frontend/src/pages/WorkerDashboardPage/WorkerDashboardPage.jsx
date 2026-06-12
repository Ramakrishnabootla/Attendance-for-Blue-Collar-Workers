import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWorkerAttendance, fetchNotifications, dismissNotifications, fetchWorkerMLPrediction, fetchWorkerInsights } from '../../utils/api'
import { getTodayIndia, formatDateReadable, formatIndiaTimeWith12Hour, formatSecondsToHHMMSS } from '../../utils/timezoneHelper'
import WorkerProfileHeader from './components/Shared/WorkerProfileHeader'
import WorkerStatsRow from './components/Shared/WorkerStatsRow'
import HistoryTab from './components/HistoryTab/HistoryTab'
import AnalysisTab from './components/AnalysisTab/AnalysisTab'
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
        <WorkerProfileHeader 
          worker={worker} 
          handleLogoutClick={handleLogoutClick} 
        />

        {/* Stats Row */}
        <WorkerStatsRow 
          presentDays={presentDays}
          totalDays={totalDays}
          attendanceRate={attendanceRate}
          totalHours={totalHours}
        />

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
          <HistoryTab 
            todayDateStr={todayDateStr}
            todayRecord={todayRecord}
            formatHours={formatHours}
            history={history}
            loading={loading}
            error={error}
          />
        ) : (
          <AnalysisTab 
            mlData={mlData}
            loadingMl={loadingMl}
            aiInsights={aiInsights}
          />
        )}
      </div>
    </div>
  )
}

export default WorkerDashboardPage

