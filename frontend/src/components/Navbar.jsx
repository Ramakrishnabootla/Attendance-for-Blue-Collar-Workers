import { useNavigate } from 'react-router-dom'

function Navbar({ supervisor, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <nav>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '24px' }}>
        <span className="brand">👷 BlueTrack</span>
        <a onClick={() => navigate('/analytics')} style={{ cursor: 'pointer' }}>📈 Analytics</a>
        <a onClick={() => navigate('/workers')} style={{ cursor: 'pointer' }}>👥 Workers</a>
        <a onClick={() => navigate('/marking')} style={{ cursor: 'pointer' }}>📋 Mark Attendance</a>
        <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>📊 Dashboard</a>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>👤 {supervisor?.name}</span>
        <button
          onClick={handleLogout}
          style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '6px', color: 'white', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
