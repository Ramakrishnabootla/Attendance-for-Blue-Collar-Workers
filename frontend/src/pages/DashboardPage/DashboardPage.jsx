import { useState, useEffect } from 'react'
import { fetchTodayAttendance, getAttendanceByDateRange, fetchMLPredictions, generateMLPredictions } from '../../utils/api'
import { getTodayIndia, formatDateReadable, formatSecondsToHHMMSS, formatIndiaTimeWith12Hour } from '../../utils/timezoneHelper'
import SearchBar from '../../components/SearchBar'
import DateRangeSelector from '../../components/DateRangeSelector'
import AttendanceTab from './components/AttendanceTab/AttendanceTab'
import MLTab from './components/MLTab/MLTab'
import AITab from './components/AITab/AITab'
import './DashboardPage.css'

function DashboardPage() {
  const [data, setData] = useState(null)
  const [filteredData, setFilteredData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateLoading, setDateLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDateSelector, setShowDateSelector] = useState(false)
  
  // Date Range states: Default is today's date
  const [startDate, setStartDate] = useState(getTodayIndia())
  const [endDate, setEndDate] = useState(getTodayIndia())

  // Multi-dimensional filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [shiftFilter, setShiftFilter] = useState('All')

  // ML predictions states
  const [activeTab, setActiveTab] = useState('attendance') // 'attendance' or 'ml'
  const [selectedAiContractor, setSelectedAiContractor] = useState('all')
  const [mlPredictions, setMlPredictions] = useState([])
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState('')
  const [mlSearchQuery, setMlSearchQuery] = useState('')

  const getTodayFormatted = () => {
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
      setStartDate(getTodayIndia())
      setEndDate(getTodayIndia())
      setSearchQuery('')
      setShiftFilter('All')
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadMLPredictions = async () => {
    try {
      setMlLoading(true)
      setMlError('')
      const response = await fetchMLPredictions()
      if (response.success) {
        setMlPredictions(response.predictions || [])
      } else {
        setMlError(response.error || 'Failed to load ML predictions')
      }
    } catch (err) {
      setMlError('Failed to connect to ML prediction service')
    } finally {
      setMlLoading(false)
    }
  }

  const handleReRunPredictions = async () => {
    try {
      setMlLoading(true)
      setMlError('')
      const response = await generateMLPredictions()
      if (response.success) {
        setMlPredictions(response.predictions || [])
      } else {
        setMlError(response.error || 'Failed to generate ML predictions')
      }
    } catch (err) {
      setMlError('Failed to connect to ML prediction service')
    } finally {
      setMlLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'ml' && mlPredictions.length === 0) {
      loadMLPredictions()
    }
  }

  const handleDateRangeSelect = async (start, end) => {
    try {
      setDateLoading(true)
      setStartDate(start)
      setEndDate(end)
      setShowDateSelector(false)

      // Fetch attendance for selected range
      const response = await getAttendanceByDateRange(start, end)

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
        setError('Failed to load range data')
      }
    } catch (err) {
      setError('Failed to load attendance for selected date range')
    } finally {
      setDateLoading(false)
    }
  }

  const handleSearchResults = (results) => {
    if (results && results.length > 0) {
      const matchedWorkerIds = results.map(w => w.worker_id)
      setSearchQuery(results.map(w => w.worker_id).join(', '))
    } else {
      setSearchQuery('')
    }
  }

  const handleExportCSV = () => {
    if (!activeRecords || activeRecords.length === 0) return

    // Define CSV headers
    const headers = ['Worker ID', 'Name', 'Job Type', 'Date', 'Shift', 'Check-In', 'Check-Out', 'Hours Worked', 'Status', 'Absence Reason']

    // Map attendance data to rows
    const rows = activeRecords.map(record => {
      const checkInFormatted = record.check_in ? formatIndiaTimeWith12Hour(record.check_in) : '-'
      const checkOutFormatted = record.check_out ? formatIndiaTimeWith12Hour(record.check_out) : '-'
      const hoursFormatted = formatHoursDecimal(record.time_spent_seconds, record.status)
      
      return [
        record.worker_id,
        record.name,
        record.job_type,
        record.date || startDate,
        record.shift_type || 'General',
        checkInFormatted,
        checkOutFormatted,
        hoursFormatted,
        record.status,
        record.absence_reason || '-'
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `BlueTrack_Attendance_${startDate}_to_${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  const attendance = filteredData?.attendance || []

  // Extract unique contractors
  const uniqueContractorsMap = {}
  attendance.forEach(record => {
    if (record.contractor_id) {
      uniqueContractorsMap[record.contractor_id] = record.contractor_name || record.contractor_id
    }
  })
  const uniqueContractors = Object.keys(uniqueContractorsMap).map(id => ({
    id,
    name: uniqueContractorsMap[id]
  }))

  // Apply filters in-memory
  const activeRecords = attendance.filter(record => {
    // 1. Shift Filter
    if (shiftFilter !== 'All' && (record.shift_type || 'General') !== shiftFilter) return false
    
    // 2. Worker ID / Name Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const searchTerms = q.split(',').map(term => term.trim()).filter(Boolean)
      
      if (searchTerms.length > 0) {
        const matchesSearch = searchTerms.some(term => 
          (record.worker_id && record.worker_id.toLowerCase().includes(term)) ||
          (record.name && record.name.toLowerCase().includes(term)) ||
          (record.job_type && record.job_type.toLowerCase().includes(term))
        )
        if (!matchesSearch) return false
      }
    }
    return true
  })

  // Dynamic statistics calculations
  const totalRecords = activeRecords.length
  const presentCount = activeRecords.filter(r => r.status === 'Present').length
  const absentCount = activeRecords.filter(r => r.status === 'Absent').length
  const presentPercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

  const totalSeconds = activeRecords.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0)
  const totalHours = (totalSeconds / 3600).toFixed(1)

  const isFilteredDate = startDate !== getTodayIndia() || endDate !== getTodayIndia()

  const formatHoursDecimal = (seconds, status) => {
    if (status !== 'Present') return '-'
    if (seconds === null || seconds === undefined) return 'Ongoing'
    return `${(seconds / 3600).toFixed(1)} hrs`
  }

  return (
    <div className="dashboard-container page">
      <div className="container">
        <h1 className="dashboard-header">
          📊 Attendance Dashboard
        </h1>
        <p className="dashboard-subheader" style={{ marginBottom: '24px', fontWeight: '600', color: 'var(--text-light)' }}>
          Period: {isFilteredDate ? `${formatDateReadable(startDate)} to ${formatDateReadable(endDate)}` : getTodayFormatted()}
        </p>

        {/* Tab Selector Switcher */}
        <div className="dashboard-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <button 
            className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('attendance')}
            style={{ minWidth: '220px' }}
          >
            📋 Attendance Logs & Statistics
          </button>
          <button 
            className={`btn ${activeTab === 'ml' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('ml')}
            style={{ minWidth: '260px' }}
          >
            🧠 ML Attendance Behavior Predictions
          </button>
          <button 
            className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('ai')}
            style={{ minWidth: '220px' }}
          >
            🤖 AI Attendance Insights
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {activeTab === 'attendance' && (
          <AttendanceTab
            searchQuery={searchQuery}
            handleSearchResults={handleSearchResults}
            shiftFilter={shiftFilter}
            setShiftFilter={setShiftFilter}
            isFilteredDate={isFilteredDate}
            showDateSelector={showDateSelector}
            setShowDateSelector={setShowDateSelector}
            loadDashboard={loadDashboard}
            handleExportCSV={handleExportCSV}
            activeRecords={activeRecords}
            handleDateRangeSelect={handleDateRangeSelect}
            totalRecords={totalRecords}
            presentCount={presentCount}
            absentCount={absentCount}
            presentPercentage={presentPercentage}
            totalHours={totalHours}
            dateLoading={dateLoading}
            formatHoursDecimal={formatHoursDecimal}
          />
        )}
        
        {activeTab === 'ml' && (
          <MLTab
            mlError={mlError}
            mlPredictions={mlPredictions}
            mlSearchQuery={mlSearchQuery}
            setMlSearchQuery={setMlSearchQuery}
            handleReRunPredictions={handleReRunPredictions}
            mlLoading={mlLoading}
          />
        )}

        {activeTab === 'ai' && (
          <AITab
            selectedAiContractor={selectedAiContractor}
            setSelectedAiContractor={setSelectedAiContractor}
            uniqueContractors={uniqueContractors}
          />
        )}
      </div>
    </div>
  )
}

export default DashboardPage
