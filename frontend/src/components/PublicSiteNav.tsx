import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Globe, Heart, Menu, Moon, Sun, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { getCookie, setCookie } from '../lib/cookies'

const t = {
  en: {
    home: 'Home',
    impact: 'Our Impact',
    awareness: 'Stories',
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
    awareness: 'Stories',
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (getCookie('oa_theme') === 'dark' ? 'dark' : 'light'))

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleLang = () => setLang(lang === 'en' ? 'tl' : 'en')
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setCookie('oa_theme', next, { sameSite: 'Lax', path: '/', days: 365 })
  }

  const accountLinks = (
    <>
      {isDonor ? (
        <>
          <button
            type="button"
            onClick={() => navigate('/donor')}
            className="public-nav-link-btn"
            style={{ color: pathname === '/donor' ? 'var(--terracotta)' : 'var(--text)' }}
          >
            {tx.dashboard}
          </button>
          <button type="button" onClick={logout} className="public-nav-link-btn">
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
          <button type="button" onClick={logout} className="public-nav-link-btn">
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
    </>
  )

  return (
    <>
      <nav
        style={{
          background: 'var(--nav-bg)',
          borderBottom: '1px solid var(--border)',
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

        <div className="public-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
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
          <Link
            to="/awareness"
            style={{ fontSize: 14, fontWeight: 500, color: pathname === '/awareness' ? 'var(--terracotta)' : 'var(--text)' }}
          >
            {tx.awareness}
          </Link>
          {accountLinks}
          <Link to="/donate" className="btn btn-primary btn-sm">
            {tx.donate}
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={16} aria-hidden="true" />
            <button
              type="button"
              onClick={toggleLang}
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

        <button
          type="button"
          className="public-nav-mobile-toggle"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="public-nav-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="public-nav-mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="public-nav-mobile-links">
              <Link to="/" className="public-nav-mobile-link">
                {tx.home}
              </Link>
              <Link to="/impact" className="public-nav-mobile-link">
                {tx.impact}
              </Link>
              <Link to="/awareness" className="public-nav-mobile-link">
                {tx.awareness}
              </Link>
              {isDonor && (
                <button type="button" className="public-nav-mobile-link public-nav-mobile-button" onClick={() => navigate('/donor')}>
                  {tx.dashboard}
                </button>
              )}
              {isInternalStaff && (
                <Link to="/admin" className="public-nav-mobile-link">
                  {tx.admin}
                </Link>
              )}
              {!user && (
                <>
                  <Link to="/login" className="public-nav-mobile-link">
                    {tx.login}
                  </Link>
                  <Link to="/signup" className="public-nav-mobile-link">
                    {tx.signup}
                  </Link>
                </>
              )}
              {user && (
                <button type="button" className="public-nav-mobile-link public-nav-mobile-button" onClick={logout}>
                  {tx.signout}
                </button>
              )}
              <Link to="/donate" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                {tx.donate}
              </Link>
              <button
                type="button"
                className="public-nav-mobile-link public-nav-mobile-button"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={16} aria-hidden="true" />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Language</span>
              </div>
              <button
                type="button"
                onClick={toggleLang}
                style={{
                  padding: '6px 10px',
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

            <div className="public-nav-mobile-footer">
              <div className="public-nav-mobile-footer-brand">Open Arms</div>
              <p className="public-nav-mobile-footer-text">
                Supporting survivors of sexual abuse and trafficking in the Philippines.
              </p>
              <div className="public-nav-mobile-footer-links">
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/impact">Our Impact</Link>
                <Link to="/awareness">Stories</Link>
                <Link to="/donate">Donate</Link>
                <a href="mailto:info@openarms.org">Contact</a>
              </div>
              <p className="public-nav-mobile-footer-copy">© 2024 Open Arms. All rights reserved.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
