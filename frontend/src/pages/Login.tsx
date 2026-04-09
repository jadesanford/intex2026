import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, AlertCircle } from 'lucide-react'

const t = {
  en: {
    fillFields: 'Please fill in all fields.',
    invalidCreds: 'Invalid username or password. Please try again.',
    title: 'Sign In',
    subtitle: 'Welcome back — sign in to your account',
    username: 'Username or Email',
    usernamePlaceholder: 'Enter your username or email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    signingIn: 'Signing in...',
    signIn: 'Sign In',
    createSupporter: 'Create a Supporter Account',
    backToSite: '← Back to public site',
    continueGoogle: 'Continue with Google',
    googleErrors: {
      google_no_email: 'Google did not return an email. Try another account or use password sign-in.',
      google_no_account: 'No Open Arms account matches that Google email. Sign up first or use your registered email.',
      google_inactive: 'This account is inactive. Contact support.',
      google_missing_token: 'Sign-in could not be completed. Please try again.',
      google_session_failed: 'Could not load your profile after Google sign-in. Try password sign-in.',
      google_role: 'Your account role could not be read after Google sign-in. Try password sign-in or contact support.',
    } as Record<string, string>,
  },
  tl: {
    fillFields: 'Pakipunan ang lahat ng fields.',
    invalidCreds: 'Maling username o password. Subukan muli.',
    title: 'Mag-sign In',
    subtitle: 'Maligayang pagbabalik — mag-sign in sa iyong account',
    username: 'Username o Email',
    usernamePlaceholder: 'Ilagay ang iyong username o email',
    password: 'Password',
    passwordPlaceholder: 'Ilagay ang iyong password',
    signingIn: 'Nag-si-sign in...',
    signIn: 'Mag-sign In',
    createSupporter: 'Gumawa ng Supporter Account',
    backToSite: '← Bumalik sa site',
    continueGoogle: 'Magpatuloy gamit ang Google',
    googleErrors: {
      google_no_email: 'Walang email mula sa Google. Subukan ang ibang account o password.',
      google_no_account: 'Walang Open Arms account na tumutugma sa Google email. Mag-sign up muna.',
      google_inactive: 'Hindi aktibo ang account na ito.',
      google_missing_token: 'Hindi natapos ang sign-in. Subukan muli.',
      google_session_failed: 'Hindi ma-load ang profile pagkatapos ng Google. Subukan ang password.',
      google_role: 'Hindi mabasa ang role ng account pagkatapos ng Google. Subukan ang password o contact support.',
    } as Record<string, string>,
  }
}

export default function Login({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  const { login } = useAuth()
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const googleErrorFromUrl = useMemo(() => {
    const code = searchParams.get('error')
    if (!code || !tx.googleErrors[code]) return ''
    return tx.googleErrors[code]
  }, [searchParams, tx.googleErrors])

  useEffect(() => {
    if (!googleErrorFromUrl) return
    setError(googleErrorFromUrl)
    const next = new URLSearchParams(searchParams)
    next.delete('error')
    setSearchParams(next, { replace: true })
  }, [googleErrorFromUrl, searchParams, setSearchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError(tx.fillFields); return }
    setLoading(true); setError('')
    try {
      const data: any = await login(form.username, form.password)
      nav(data?.role === 'donor' ? '/donor' : '/admin')
    } catch {
      setError(tx.invalidCreds)
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
          <h1 style={{ fontSize: 28, marginBottom: 8, marginTop: 12, color: 'var(--navy)' }}>{tx.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{tx.subtitle}</p>
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
              <label>{tx.username}</label>
              <input
                type="text" placeholder={tx.usernamePlaceholder}
                value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>{tx.password}</label>
              <input
                type="password" placeholder={tx.passwordPlaceholder}
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}
              disabled={loading}
            >
              {loading ? tx.signingIn : tx.signIn}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button
            type="button"
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, gap: 10, marginBottom: 12 }}
            onClick={() => {
              window.location.assign('/api/auth/login-google')
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            {tx.continueGoogle}
          </button>

          <Link to="/signup" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '11px', borderRadius: 10, border: '1.5px solid var(--border)',
            color: 'var(--navy)', fontSize: 15, fontWeight: 500, textDecoration: 'none',
            transition: 'all 0.15s', gap: 8
          }}>
            <Heart size={16} color="var(--terracotta)" />
            {tx.createSupporter}
          </Link>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{tx.backToSite}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
