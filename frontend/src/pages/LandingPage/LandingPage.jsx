import React, { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchTodayAttendance, getAttendanceStatistics } from '../../utils/api'
import { formatDateReadable } from '../../utils/timezoneHelper'
import './LandingPage.css'

export default function LandingPage() {
  const [todayData, setTodayData] = useState(null)
  const [weekData, setWeekData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const today = await fetchTodayAttendance()
      const week = await getAttendanceStatistics(7)
      setTodayData(today)
      setWeekData(week)
      setError('')
    } catch (err) {
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="landing-page page"><div className="spinner"></div></div>
  }

  // Prepare Today's Pie Chart Data
  const todayPieData = [
    { name: 'Present', value: todayData?.summary?.present_today || 0 },
    { name: 'Absent', value: todayData?.summary?.absent_today || 0 }
  ]

  // Prepare 7-Day Bar Chart Data
  const weekBarData = weekData?.statistics ? weekData.statistics.reverse() : []

  const COLORS = {
    present: '#10B981',
    absent: '#EF4444'
  }

  const PIE_COLORS = [COLORS.present, COLORS.absent]

  const summaryStats = todayData?.summary || { total_workers: 0, present_today: 0, absent_today: 0 }
  const presentPercentage = summaryStats.total_workers > 0
    ? Math.round((summaryStats.present_today / summaryStats.total_workers) * 100)
    : 0

  return (
    <div className="landing-page page">
      <div className="container">
        {error && <div className="alert alert-error">{error}</div>}

        <h1 className="landing-header">📈 Analytics Dashboard</h1>

        {/* Summary Cards */}
        <div className="landing-summary-cards">
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-content">
              <h3>{summaryStats.total_workers}</h3>
              <p>Total Workers</p>
            </div>
          </div>

          <div className="summary-card present-card">
            <div className="summary-icon">✓</div>
            <div className="summary-content">
              <h3>{summaryStats.present_today}</h3>
              <p>Present Today</p>
            </div>
          </div>

          <div className="summary-card absent-card">
            <div className="summary-icon">✕</div>
            <div className="summary-content">
              <h3>{summaryStats.absent_today}</h3>
              <p>Absent Today</p>
            </div>
          </div>

          <div className="summary-card percentage-card">
            <div className="summary-icon">%</div>
            <div className="summary-content">
              <h3>{presentPercentage}%</h3>
              <p>Attendance Rate</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="landing-charts">
          {/* Today's Pie Chart */}
          <div className="landing-chart-card">
            <h3>Today's Attendance Breakdown</h3>
            <div className="landing-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={todayPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {todayPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} workers`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7-Day Bar Chart */}
          <div className="landing-chart-card">
            <h3>Past 7 Days Attendance Trend</h3>
            <div className="landing-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekBarData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => {
                      const d = new Date(date + 'T00:00:00')
                      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => `${value} workers`}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="present_count" fill={COLORS.present} name="Present" />
                  <Bar dataKey="absent_count" fill={COLORS.absent} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="landing-detailed-section">
          <h2>Today's Attendance Details</h2>

          {todayData?.attendance && todayData.attendance.length > 0 ? (
            <div className="landing-table-wrapper">
              <table className="landing-table">
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
                  {todayData.attendance.map((record, idx) => (
                    <tr key={idx}>
                      <td><strong>{record.worker_id}</strong></td>
                      <td>{record.name}</td>
                      <td><span className="job-badge">{record.job_type}</span></td>
                      <td>{record.check_in ? new Date(record.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '-'}</td>
                      <td>{record.check_out ? new Date(record.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '-'}</td>
                      <td>
                        <span className={`status-badge ${record.status.toLowerCase()}`}>
                          {record.status === 'Present' ? '✓ Present' : '✕ Absent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No attendance records available</p>
          )}
        </div>

        {/* Refresh Button */}
        <div className="landing-footer">
          <button className="btn btn-primary" onClick={loadData}>
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}
