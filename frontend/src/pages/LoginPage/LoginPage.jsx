import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginSupervisor } from '../../utils/api'
import './LoginPage.css'

function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('9999999999')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await loginSupervisor(phone, password)

      if (data.success) {
        onLogin(data.supervisor)
        navigate('/workers')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Connection error - Backend running on :5000?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container page">
      <div className="login-card card">
        <h1>👷 BlueTrack</h1>
        <p>Digital Attendance System</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>👤 Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9999999999"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>🔑 Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? '⏳ Logging in...' : '→ Login'}
          </button>
        </form>

        <div className="demo-credentials">
          <p>📝 Demo Credentials</p>
          <p>Phone: 9999999999 | Password: admin123</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
