import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Props { children: React.ReactNode; lang: 'en' | 'tl'; setLang: (l: 'en' | 'tl') => void }

const t = {
  en: { home: 'Home', impact: 'Our Impact', login: 'Login', donate: 'Donate', signup: 'Create Account', dashboard: 'My Dashboard', signout: 'Sign Out', cookieMsg: 'We use cookies to enhance your experience.', accept: 'Accept' },
  tl: { home: 'Tahanan', impact: 'Aming Epekto', login: 'Login', donate: 'Mag-donate', signup: 'Gumawa ng Account', dashboard: 'Aking Dashboard', signout: 'Mag-sign Out', cookieMsg: 'Gumagamit kami ng cookies upang mapabuti ang inyong karanasan.', accept: 'Tanggapin' }
}

export default function PublicLayout({ children, lang, setLang }: Props) {
  const { pathname } = useLocation()
  const { user, logout, isDonor } = useAuth()
  const navigate = useNavigate()
  const [cookieAccepted, setCookieAccepted] = useState(
    () => localStorage.getItem('oa_cookie') === '1'
  )
  const tx = t[lang]

  const acceptCookie = () => { localStorage.setItem('oa_cookie', '1'); setCookieAccepted(true) }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Playfair Display, serif' }}>
          <div style={{
            width: 36, height: 36, background: 'var(--terracotta)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Heart size={18} color="white" fill="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--terracotta)' }}>Open Arms</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setLang('en')} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: lang === 'en' ? 'var(--terracotta)' : 'transparent',
              color: lang === 'en' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)',
              cursor: 'pointer'
            }}>EN</button>
            <button onClick={() => setLang('tl')} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: lang === 'tl' ? 'var(--terracotta)' : 'transparent',
              color: lang === 'tl' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)',
              cursor: 'pointer'
            }}>TL</button>
          </div>
          <Link to="/" style={{ fontSize: 14, fontWeight: 500, color: pathname === '/' ? 'var(--terracotta)' : 'var(--text)' }}>{tx.home}</Link>
          <Link to="/impact" style={{ fontSize: 14, fontWeight: 500, color: pathname === '/impact' ? 'var(--terracotta)' : 'var(--text)' }}>{tx.impact}</Link>

          {isDonor ? (
            <>
              <button onClick={() => navigate('/donor')} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{tx.dashboard}</button>
              <button onClick={logout} style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{tx.signout}</button>
            </>
          ) : !user ? (
            <>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>{tx.login}</Link>
              <Link to="/signup" style={{ fontSize: 14, fontWeight: 500, color: 'var(--navy)' }}>{tx.signup}</Link>
            </>
          ) : null}

          <Link to="/donate" className="btn btn-primary btn-sm">{tx.donate}</Link>
        </div>
      </nav>

      <main style={{ flex: 1 }}>{children}</main>

      <footer style={{
        background: 'var(--navy)', color: 'rgba(255,255,255,0.7)',
        padding: '40px 24px', textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Heart size={16} color="var(--terracotta)" fill="var(--terracotta)" />
          <span style={{ fontFamily: 'Playfair Display, serif', color: 'white', fontSize: 18 }}>Open Arms</span>
        </div>
        <p style={{ fontSize: 13, marginBottom: 12 }}>Supporting survivors of sexual abuse and trafficking in the Philippines.</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', fontSize: 13 }}>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.7)' }}>Privacy Policy</Link>
          <Link to="/impact" style={{ color: 'rgba(255,255,255,0.7)' }}>Our Impact</Link>
          <Link to="/donate" style={{ color: 'rgba(255,255,255,0.7)' }}>Donate</Link>
          <a href="mailto:info@openarms.org" style={{ color: 'rgba(255,255,255,0.7)' }}>Contact</a>
        </div>
        <p style={{ fontSize: 12, marginTop: 16 }}>© 2024 Open Arms. All rights reserved.</p>
      </footer>

      {!cookieAccepted && (
        <div className="cookie-banner">
          <span>{tx.cookieMsg} <Link to="/privacy" style={{ color: '#93c5fd', textDecoration: 'underline' }}>Learn more</Link></span>
          <button className="btn btn-primary btn-sm" onClick={acceptCookie}>{tx.accept}</button>
        </div>
      )}
    </div>
  )
}
