import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import LandingPage from './pages/LandingPage/LandingPage'
import WorkersPage from './pages/WorkersPage/WorkersPage'
import AttendanceMarkingPage from './pages/AttendanceMarkingPage/AttendanceMarkingPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import Navbar from './components/Navbar'

function App() {
  const [supervisor, setSupervisor] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if supervisor is logged in
  useEffect(() => {
    const storedSupervisor = localStorage.getItem('supervisor')
    if (storedSupervisor) {
      setSupervisor(JSON.parse(storedSupervisor))
    }
    setLoading(false)
  }, [])

  const handleLogin = (supervisorData) => {
    setSupervisor(supervisorData)
    localStorage.setItem('supervisor', JSON.stringify(supervisorData))
  }

  const handleLogout = () => {
    setSupervisor(null)
    localStorage.removeItem('supervisor')
  }

  if (loading) {
    return <div className="spinner"></div>
  }

  return (
    <Router>
      {supervisor && <Navbar supervisor={supervisor} onLogout={handleLogout} />}
      <Routes>
        <Route
          path="/login"
          element={supervisor ? <Navigate to="/analytics" /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/analytics"
          element={supervisor ? <LandingPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/workers"
          element={supervisor ? <WorkersPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/marking"
          element={supervisor ? <AttendanceMarkingPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={supervisor ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={supervisor ? '/analytics' : '/login'} />} />
      </Routes>
    </Router>
  )
}

export default App
