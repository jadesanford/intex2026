import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      const data = await login(form.username, form.password)
      nav(data?.role === 'donor' ? '/donor' : '/admin')
    } catch {
      setError('Invalid username or password. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, var(--beige) 0%, white 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 64, height: 64, background: 'var(--terracotta)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <Heart size={28} color="white" fill="white" />
            </div>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: 'var(--terracotta)' }}>Open Arms</span>
          </Link>
          <h1 style={{ fontSize: 28, marginBottom: 8, marginTop: 12, color: 'var(--navy)' }}>Sign In</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Welcome back — sign in to your account</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, background: '#fee2e2',
              color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username or Email</label>
              <input
                type="text" placeholder="Enter your username or email"
                value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password" placeholder="Enter your password"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <Link to="/signup" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '11px', borderRadius: 10, border: '1.5px solid var(--border)',
            color: 'var(--navy)', fontSize: 15, fontWeight: 500, textDecoration: 'none',
            transition: 'all 0.15s', gap: 8
          }}>
            <Heart size={16} color="var(--terracotta)" />
            Create a Supporter Account
          </Link>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← Back to public site</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
