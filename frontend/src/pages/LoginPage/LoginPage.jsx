import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginSupervisor, loginWorker } from '../../utils/api'
import './LoginPage.css'

function LoginPage({ onLogin }) {
  // Login Role: 'supervisor' or 'worker'
  const [role, setRole] = useState('supervisor')

  // Supervisor Credentials
  const [phone, setPhone] = useState('9999999999')
  const [password, setPassword] = useState('admin123')

  // Worker Credentials
  const [workerId, setWorkerId] = useState('W001')
  const [loginMethod, setLoginMethod] = useState('pin') // 'pin' or 'phone'
  const [workerPhone, setWorkerPhone] = useState('')
  const [workerPin, setWorkerPin] = useState('1234')

  // Global UI State
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (role === 'supervisor') {
        const data = await loginSupervisor(phone, password)
        if (data.success) {
          onLogin(data.supervisor, 'supervisor')
          navigate('/analytics')
        } else {
          setError(data.error || 'Supervisor login failed')
        }
      } else {
        const credentialPhone = loginMethod === 'phone' ? workerPhone : null
        const credentialPin = loginMethod === 'pin' ? workerPin : null
        const data = await loginWorker(workerId, credentialPhone, credentialPin)

        if (data.success) {
          onLogin(data.worker, 'worker')
          navigate('/worker-dashboard')
        } else {
          setError(data.error || 'Worker login failed')
        }
      }
    } catch (err) {
      setError('Connection error - Is backend running on http://localhost:5000?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container page">
      <div className="login-card card">
        <h1>👷 BlueTrack</h1>
        <p>Digital Attendance System</p>

        {/* Tab Switcher */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${role === 'supervisor' ? 'active' : ''}`}
            onClick={() => {
              setRole('supervisor')
              setError('')
            }}
          >
            📋 Supervisor
          </button>
          <button
            type="button"
            className={`login-tab-btn ${role === 'worker' ? 'active' : ''}`}
            onClick={() => {
              setRole('worker')
              setError('')
            }}
          >
            👷 Worker Login
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {role === 'supervisor' ? (
            // Supervisor Form
            <>
              <div className="form-group">
                <label>👤 Supervisor Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9999999999"
                  disabled={loading}
                  required
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
                  required
                />
              </div>
            </>
          ) : (
            // Worker Form
            <>
              <div className="form-group">
                <label>🆔 Worker ID</label>
                <input
                  type="text"
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value.toUpperCase())}
                  placeholder="W001"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>🔑 Authentication Method</label>
                <select
                  value={loginMethod}
                  onChange={(e) => {
                    setLoginMethod(e.target.value)
                    setError('')
                  }}
                  className="login-method-select"
                  disabled={loading}
                >
                  <option value="pin">4-Digit PIN Password</option>
                  <option value="phone">Registered Phone Number</option>
                </select>
              </div>

              {loginMethod === 'phone' ? (
                <div className="form-group">
                  <label>📞 Registered Phone Number</label>
                  <input
                    type="text"
                    value={workerPhone}
                    onChange={(e) => setWorkerPhone(e.target.value)}
                    placeholder="9876543210"
                    disabled={loading}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>🔢 4-Digit Security PIN</label>
                  <input
                    type="password"
                    value={workerPin}
                    onChange={(e) => setWorkerPin(e.target.value)}
                    placeholder="••••"
                    maxLength={4}
                    disabled={loading}
                    required
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? '⏳ Logging in...' : `→ Login as ${role === 'supervisor' ? 'Supervisor' : 'Worker'}`}
          </button>
        </form>

        <div className="demo-credentials">
          <p>📝 Demo Credentials</p>
          {role === 'supervisor' ? (
            <p>Phone: 9999999999 | Password: admin123</p>
          ) : (
            <p>Worker ID: W001 | PIN: 1234 (or Phone: 9876543210)</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
