import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import LandingPage from './pages/LandingPage/LandingPage'
import WorkersPage from './pages/WorkersPage/WorkersPage'
import AttendanceMarkingPage from './pages/AttendanceMarkingPage/AttendanceMarkingPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import ContractorsPage from './pages/ContractorsPage/ContractorsPage'
import WorkerDashboardPage from './pages/WorkerDashboardPage/WorkerDashboardPage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  const [supervisor, setSupervisor] = useState(null)
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if session exists in local storage
  useEffect(() => {
    const storedSupervisor = localStorage.getItem('supervisor')
    if (storedSupervisor) {
      setSupervisor(JSON.parse(storedSupervisor))
    }
    const storedWorker = localStorage.getItem('worker')
    if (storedWorker) {
      setWorker(JSON.parse(storedWorker))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, role) => {
    if (role === 'supervisor') {
      setSupervisor(userData)
      localStorage.setItem('supervisor', JSON.stringify(userData))
      setWorker(null)
      localStorage.removeItem('worker')
    } else {
      setWorker(userData)
      localStorage.setItem('worker', JSON.stringify(userData))
      setSupervisor(null)
      localStorage.removeItem('supervisor')
    }
  }

  const handleLogout = () => {
    setSupervisor(null)
    localStorage.removeItem('supervisor')
    setWorker(null)
    localStorage.removeItem('worker')
  }

  if (loading) {
    return <div className="spinner"></div>
  }

  const isUserLoggedIn = supervisor || worker

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {isUserLoggedIn && (
          <Navbar 
            supervisor={supervisor} 
            worker={worker} 
            onLogout={handleLogout} 
          />
        )}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route
              path="/login"
              element={
                supervisor ? (
                  <Navigate to="/analytics" />
                ) : worker ? (
                  <Navigate to="/worker-dashboard" />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            
            {/* Supervisor Protected Routes */}
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
            <Route
              path="/contractors"
              element={supervisor ? <ContractorsPage /> : <Navigate to="/login" />}
            />

            {/* Worker Protected Routes */}
            <Route
              path="/worker-dashboard"
              element={
                worker ? (
                  <WorkerDashboardPage worker={worker} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Root Redirects */}
            <Route 
              path="/" 
              element={
                <Navigate 
                  to={
                    supervisor 
                      ? '/analytics' 
                      : worker 
                      ? '/worker-dashboard' 
                      : '/login'
                  } 
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        {isUserLoggedIn && <Footer />}
      </div>
    </Router>
  )
}

export default App
