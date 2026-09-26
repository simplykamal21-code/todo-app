import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import axios from 'axios'
import '../App.css'

// const BACKENDS = [
//   { name: 'Node.js (Express)', url: 'http://localhost:3000' },
//   { name: 'Python (FastAPI)', url: 'http://localhost:8000' },
//   { name: '.NET Core', url: 'http://localhost:5000' },
//   { name: 'Java Spring Boot', url: 'http://localhost:8080' },
// ]

export default function LoginPage() {
  const [username, setUsername] = useState('demo1')
  const [password, setPassword] = useState('password123')
  const [apiBase, setApiBase] = useState('http://localhost:8080')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${apiBase}/api/auth/login`, { username, password })
      const token = res.data.token || res.data.access_token
      if (!token) throw new Error('No token received')
      login(token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Personal Todo App</h1>
        {/* <p className="subtitle">Select backend & sign in with a demo account</p> */}

        {/* <div className="backend-selector">
          <label>Backend API:</label>
          <select value={apiBase} onChange={(e) => setApiBase(e.target.value)}>
            {BACKENDS.map((b) => (
              <option key={b.url} value={b.url}>{b.name} ({b.url})</option>
            ))}
          </select>
        </div> */}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        
      </div>
    </div>
  )
}
