import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Globe, Heart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

const t = {
  en: {
    home: 'Home',
    impact: 'Our Impact',
    login: 'Login',
    donate: 'Donate',
    signup: 'Create Account',
    dashboard: 'My Dashboard',
    admin: 'Admin',
    signout: 'Sign Out'
  },
  tl: {
    home: 'Tahanan',
    impact: 'Aming Epekto',
    login: 'Login',
    donate: 'Mag-donate',
    signup: 'Gumawa ng Account',
    dashboard: 'Aking Dashboard',
    admin: 'Admin',
    signout: 'Mag-sign Out'
  }
}

/** Same top navigation as the public site: Home, Impact, account links, Donate, language. */
export default function PublicSiteNav() {
  const { pathname } = useLocation()
  const { lang, setLang } = useLanguage()
  const { user, logout, isDonor, isInternalStaff } = useAuth()
  const navigate = useNavigate()
  const tx = t[lang]

  return (
    <nav
      style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 200,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        flexShrink: 0
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Playfair Display, serif' }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: 'var(--terracotta)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Heart size={18} color="white" fill="white" />
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--terracotta)' }}>Open Arms</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link
          to="/"
          style={{ fontSize: 14, fontWeight: 500, color: pathname === '/' ? 'var(--terracotta)' : 'var(--text)' }}
        >
          {tx.home}
        </Link>
        <Link
          to="/impact"
          style={{ fontSize: 14, fontWeight: 500, color: pathname === '/impact' ? 'var(--terracotta)' : 'var(--text)' }}
        >
          {tx.impact}
        </Link>

        {isDonor ? (
          <>
            <button
              type="button"
              onClick={() => navigate('/donor')}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: pathname === '/donor' ? 'var(--terracotta)' : 'var(--text)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {tx.dashboard}
            </button>
            <button
              type="button"
              onClick={logout}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {tx.signout}
            </button>
          </>
        ) : isInternalStaff ? (
          <>
            <Link
              to="/admin"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: pathname.startsWith('/admin') ? 'var(--terracotta)' : 'var(--text)'
              }}
            >
              {tx.admin}
            </Link>
            <button
              type="button"
              onClick={logout}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {tx.signout}
            </button>
          </>
        ) : !user ? (
          <>
            <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              {tx.login}
            </Link>
            <Link to="/signup" style={{ fontSize: 14, fontWeight: 500, color: 'var(--navy)' }}>
              {tx.signup}
            </Link>
          </>
        ) : null}

        <Link to="/donate" className="btn btn-primary btn-sm">
          {tx.donate}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={16} aria-hidden="true" />
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'tl' : 'en')}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            {lang === 'en' ? 'TL' : 'EN'}
          </button>
        </div>
      </div>
    </nav>
  )
}
