import { useState, useEffect } from 'react'
import { fetchTodayAttendance, getAttendanceByDateRange, fetchMLPredictions, generateMLPredictions } from '../../utils/api'
import { getTodayIndia, formatDateReadable, formatSecondsToHHMMSS, formatIndiaTimeWith12Hour } from '../../utils/timezoneHelper'
import SearchBar from '../../components/SearchBar'
import DateRangeSelector from '../../components/DateRangeSelector'
import AIInsights from '../../components/AIInsights'
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

        {activeTab === 'attendance' ? (
          <>
            {/* Control Bar */}
            <div className="dashboard-controls" style={{ gap: '12px', flexWrap: 'wrap', display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div className="dashboard-control-item" style={{ flex: 1, minWidth: '200px' }}>
                <SearchBar onSearch={handleSearchResults} placeholder="Search worker ID, name, or job..." />
              </div>

              <div style={{ minWidth: '150px' }}>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="shift-filter-select"
                  style={{
                    height: '46px',
                    borderRadius: '10px',
                    border: '2px solid var(--border-light)',
                    padding: '0 12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-medium)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <option value="All">All Shifts</option>
                  <option value="General">General Shift</option>
                  <option value="Morning">Morning Shift</option>
                  <option value="Evening">Evening Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>

              <button
                className={`btn ${isFilteredDate ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setShowDateSelector(!showDateSelector)}
              >
                📅 {isFilteredDate ? 'Change Range' : 'Select Date Range'}
              </button>

              {isFilteredDate && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    loadDashboard()
                  }}
                >
                  ← Reset Today
                </button>
              )}

              <button
                className="btn btn-secondary"
                onClick={loadDashboard}
              >
                🔄 Refresh
              </button>

              <button
                className="btn btn-success"
                onClick={handleExportCSV}
                disabled={activeRecords.length === 0}
              >
                📥 Export CSV
              </button>
            </div>

            {/* Date Selector Modal */}
            {showDateSelector && (
              <div className="dashboard-date-selector-wrapper">
                <DateRangeSelector
                  onDateRangeSelect={handleDateRangeSelect}
                  onCancel={() => setShowDateSelector(false)}
                />
              </div>
            )}

            {/* Summary Cards */}
            <div className="dashboard-summary-row">
              <div className="dashboard-card">
                <h3>{totalRecords}</h3>
                <p>Total Records</p>
              </div>
              <div className="dashboard-card present">
                <h3>{presentCount}</h3>
                <p>Present</p>
              </div>
              <div className="dashboard-card absent">
                <h3>{absentCount}</h3>
                <p>Absent</p>
              </div>
              <div className="dashboard-card percentage">
                <h3>{presentPercentage}%</h3>
                <p>Attendance Rate</p>
              </div>
              <div className="dashboard-card hours-card" style={{ borderTopColor: 'var(--warning-yellow)' }}>
                <h3 style={{ color: 'var(--warning-yellow-dark)' }}>{totalHours} hrs</h3>
                <p>Total Hours Worked</p>
              </div>
            </div>

            {/* Attendance Table */}
            <h2 className="dashboard-attendance-header">
              {isFilteredDate ? 'Historical Attendance Details' : "Today's Attendance Details"}
            </h2>

            {activeRecords.length === 0 ? (
              <p className="no-records">No attendance records found matching the filters.</p>
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
                      {isFilteredDate && <th>Date</th>}
                      <th>Worker ID</th>
                      <th>Name</th>
                      <th>Job Type</th>
                      <th>Shift</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Hours Worked</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecords.map((record, idx) => (
                      <tr key={idx}>
                        {isFilteredDate && <td><strong>{record.date}</strong></td>}
                        <td><strong className="dashboard-worker-id">{record.worker_id}</strong></td>
                        <td>{record.name}</td>
                        <td>{record.job_type}</td>
                        <td><span className="shift-pill" style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: 'var(--bg-lighter)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>{record.shift_type || 'General'}</span></td>
                        <td>
                          {record.check_in ? formatIndiaTimeWith12Hour(record.check_in) : '-'}
                        </td>
                        <td>
                          {record.check_out ? formatIndiaTimeWith12Hour(record.check_out) : '-'}
                        </td>
                        <td>
                          <strong>{formatHoursDecimal(record.time_spent_seconds, record.status)}</strong>
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
          </>
        ) : (
          <div className="ml-panel-content slide-in-animation">
            {mlError && <div className="alert alert-error">{mlError}</div>}
            
            {/* ML Summary Metrics Row */}
            <div className="ml-summary-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="ml-stat-card card" style={{ padding: '16px', textAlign: 'center', borderTop: '4px solid var(--primary-blue)' }}>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0' }}>{mlPredictions.length}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Total Evaluated Workers</p>
              </div>
              <div className="ml-stat-card card" style={{ padding: '16px', textAlign: 'center', borderTop: '4px solid var(--success-green)' }}>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--success-green-dark)' }}>
                  {mlPredictions.filter(p => p.prediction.category === 'Regular').length}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Regular Workers (Low Risk)</p>
              </div>
              <div className="ml-stat-card card" style={{ padding: '16px', textAlign: 'center', borderTop: '4px solid var(--warning-yellow)' }}>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--warning-yellow-dark)' }}>
                  {mlPredictions.filter(p => p.prediction.category === 'Irregular').length}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase' }}>Irregular Attendance (Medium Risk)</p>
              </div>
              <div className="ml-stat-card card" style={{ padding: '16px', textAlign: 'center', borderTop: '4px solid var(--danger-red)' }}>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--danger-red-dark)' }}>
                  {mlPredictions.filter(p => p.prediction.category === 'High_Risk').length}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase' }}>High Absence Risk (High Risk)</p>
              </div>
            </div>

            {/* ML Control Bar */}
            <div className="ml-controls-row card" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', padding: '16px' }}>
              <div className="ml-search-box" style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="🔍 Search worker ID, name, or risk level (e.g. HIGH, LOW)..."
                  value={mlSearchQuery}
                  onChange={(e) => setMlSearchQuery(e.target.value)}
                  className="ml-search-input"
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '10px',
                    border: '2px solid var(--border-light)',
                    padding: '0 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
              </div>
              <button 
                className="btn btn-outline" 
                onClick={handleReRunPredictions} 
                disabled={mlLoading}
                style={{ height: '46px', minWidth: '220px' }}
              >
                {mlLoading ? '⏳ Scoring Models...' : '🔄 Re-Run ML Predictions'}
              </button>
            </div>

            {mlLoading ? (
              <div className="spinner-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                <div className="spinner" style={{ marginBottom: '16px' }}></div>
                <p className="loading-text" style={{ fontStyle: 'italic', color: 'var(--text-light)' }}>Random Forest Classifier is analyzing historical trends and absences averages...</p>
              </div>
            ) : (
              <div className="ml-predictions-table-card card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-wrapper">
                  <table className="ml-predictions-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '2px solid var(--border-light)' }}>
                        <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Worker ID</th>
                        <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Name</th>
                        <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Job Type</th>
                        <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Contractor</th>
                        <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>ML Prediction Category</th>
                        <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Risk Level</th>
                        <th style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Recommendations & Action Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mlPredictions.filter(p => {
                        if (!mlSearchQuery.trim()) return true;
                        const q = mlSearchQuery.toLowerCase();
                        return (p.worker_id || '').toLowerCase().includes(q) ||
                               (p.name || '').toLowerCase().includes(q) ||
                               (p.prediction?.category || '').toLowerCase().includes(q) ||
                               (p.prediction?.risk_level || '').toLowerCase().includes(q);
                      }).length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)', fontStyle: 'italic' }}>No predictions matched your filters.</td>
                        </tr>
                      ) : (
                        mlPredictions.filter(p => {
                          if (!mlSearchQuery.trim()) return true;
                          const q = mlSearchQuery.toLowerCase();
                          return (p.worker_id || '').toLowerCase().includes(q) ||
                                 (p.name || '').toLowerCase().includes(q) ||
                                 (p.prediction?.category || '').toLowerCase().includes(q) ||
                                 (p.prediction?.risk_level || '').toLowerCase().includes(q);
                        }).map((p) => {
                          const categoryName = p.prediction.category === 'High_Risk' 
                            ? 'High Absence Risk' 
                            : p.prediction.category === 'Irregular' 
                              ? 'Irregular Attendance' 
                              : 'Regular Worker';

                          const isHigh = p.prediction.risk_level === 'HIGH';
                          const isMed = p.prediction.risk_level === 'MEDIUM';
                          
                          const badgeColor = isHigh ? 'var(--danger-red-dark)' : isMed ? 'var(--warning-yellow-dark)' : 'var(--success-green-dark)';
                          const badgeBg = isHigh ? '#FEF2F2' : isMed ? '#FEFCE8' : '#F0FDF4';
                          const badgeBorder = isHigh ? '#FEE2E2' : isMed ? '#FEF08A' : '#DCFCE7';

                          const catColor = isHigh ? 'var(--danger-red)' : isMed ? '#D97706' : 'var(--success-green)';

                          return (
                            <tr key={p.worker_id} style={{ borderBottom: '1px solid var(--border-lighter)' }}>
                              <td style={{ padding: '14px 18px' }}><strong>{p.worker_id}</strong></td>
                              <td style={{ padding: '14px 18px' }}>{p.name}</td>
                              <td style={{ padding: '14px 18px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  backgroundColor: 'var(--bg-lighter)',
                                  color: 'var(--text-medium)',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {p.job_type}
                                </span>
                              </td>
                              <td style={{ padding: '14px 18px' }}>{p.contractor_name}</td>
                              <td style={{ padding: '14px 18px' }}>
                                <strong style={{ color: catColor }}>
                                  {categoryName}
                                </strong>
                              </td>
                              <td style={{ padding: '14px 18px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  color: badgeColor,
                                  backgroundColor: badgeBg,
                                  border: `1px solid ${badgeBorder}`,
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  textAlign: 'center'
                                }}>
                                  {p.prediction.risk_level}
                                </span>
                              </td>
                              <td style={{ padding: '14px 18px' }}>
                                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-medium)', lineHeight: '1.5' }}>
                                  {p.prediction.recommendations.map((rec, rIdx) => (
                                    <li key={rIdx}>{rec}</li>
                                  ))}
                                </ul>
                              </td>
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

        {activeTab === 'ai' && (
          <div className="dashboard-section" style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontWeight: '600', color: 'var(--text-dark)' }}>Filter by Contractor:</label>
              <select
                value={selectedAiContractor}
                onChange={(e) => setSelectedAiContractor(e.target.value)}
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  padding: '0 12px',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
              >
                <option value="all">All Contractors</option>
                {uniqueContractors.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
            </div>
            <AIInsights contractorId={selectedAiContractor} period="weekly" />
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
