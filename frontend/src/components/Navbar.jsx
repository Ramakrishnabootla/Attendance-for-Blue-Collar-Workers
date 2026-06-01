import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Navbar({ supervisor, worker, onLogout }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    onLogout()
    setMobileMenuOpen(false)
    navigate('/login')
  }

  const handleNavigation = (path) => {
    navigate(path)
    setMobileMenuOpen(false)
  }

  const isSupervisor = !!supervisor
  const isWorker = !!worker

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand" onClick={() => handleNavigation('/')} style={{ cursor: 'pointer' }}>
          👷 BlueTrack
        </span>
      </div>
      
      {/* Hamburger Menu Toggle */}
      <button 
        className="hamburger-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Navigation Items */}
      <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="nav-items">
          {isSupervisor && (
            <>
              <a onClick={() => handleNavigation('/analytics')} className="nav-link">📈 Analytics</a>
              <a onClick={() => handleNavigation('/workers')} className="nav-link">👥 Workers</a>
              <a onClick={() => handleNavigation('/marking')} className="nav-link">📋 Attendance</a>
              <a onClick={() => handleNavigation('/dashboard')} className="nav-link">📊 Dashboard</a>
              <a onClick={() => handleNavigation('/contractors')} className="nav-link">💼 Contractors</a>
            </>
          )}
          {isWorker && (
            <a onClick={() => handleNavigation('/worker-dashboard')} className="nav-link">👷 My Dashboard</a>
          )}
        </div>

        <div className="nav-user">
          <span className="user-name">
            👤 {isSupervisor ? supervisor?.name : worker?.name}
            {isWorker && <span className="worker-id-tag" style={{
              fontSize: '11px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 6px',
              borderRadius: '4px',
              marginLeft: '6px',
              fontWeight: '700'
            }}>{worker?.worker_id}</span>}
          </span>
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
