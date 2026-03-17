import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Navbar({ supervisor, onLogout }) {
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

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand">👷 BlueTrack</span>
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
          <a onClick={() => handleNavigation('/analytics')} className="nav-link">📈 Analytics</a>
          <a onClick={() => handleNavigation('/workers')} className="nav-link">👥 Workers</a>
          <a onClick={() => handleNavigation('/marking')} className="nav-link">📋 Attendance</a>
          <a onClick={() => handleNavigation('/dashboard')} className="nav-link">📊 Dashboard</a>
        </div>

        <div className="nav-user">
          <span className="user-name">👤 {supervisor?.name}</span>
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
