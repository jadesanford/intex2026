import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, User, Mail, Lock, Phone, MapPin } from 'lucide-react'
import { registerDonor } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { loginWithData } = useAuth()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    phone: '', city: '', country: 'Philippines'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const data = await registerDonor({
        username: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        city: form.city || undefined,
        country: form.country
      })
      loginWithData(data)
      navigate('/donor')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--beige)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--navy)', marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={20} fill="white" color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, fontFamily: 'Playfair Display, serif' }}>Open Arms</span>
          </Link>
          <h1 style={{ fontSize: 28, marginBottom: 8, color: 'var(--navy)' }}>Create a Donor Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Join us in supporting survivors across the Philippines</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>First Name *</label>
                <input value={form.firstName} onChange={set('firstName')} required placeholder="Maria" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Last Name *</label>
                <input value={form.lastName} onChange={set('lastName')} required placeholder="Santos" />
              </div>
            </div>

            <div className="form-group">
              <label><Mail size={14} style={{ marginRight: 4 }} />Email Address *</label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label><Lock size={14} style={{ marginRight: 4 }} />Password *</label>
                <input type="password" value={form.password} onChange={set('password')} required placeholder="Min. 6 characters" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Confirm Password *</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required placeholder="Repeat password" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label><Phone size={14} style={{ marginRight: 4 }} />Phone (optional)</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+63 9XX XXX XXXX" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label><MapPin size={14} style={{ marginRight: 4 }} />City (optional)</label>
                <input value={form.city} onChange={set('city')} placeholder="Manila" />
              </div>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, marginTop: 8 }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to public site</Link>
        </p>
      </div>
    </div>
  )
}
