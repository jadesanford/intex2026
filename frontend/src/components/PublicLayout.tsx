import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, Globe, Menu, X } from 'lucide-react'

interface Props { children: React.ReactNode; lang: 'en' | 'id'; setLang: (l: 'en' | 'id') => void }

const t = {
  en: { home: 'Home', impact: 'Our Impact', login: 'Staff Login', donate: 'Donate', cookieMsg: 'We use cookies to enhance your experience.', accept: 'Accept' },
  id: { home: 'Beranda', impact: 'Dampak Kami', login: 'Masuk Staf', donate: 'Donasi', cookieMsg: 'Kami menggunakan cookie untuk meningkatkan pengalaman Anda.', accept: 'Setuju' }
}

export default function PublicLayout({ children, lang, setLang }: Props) {
  const { pathname } = useLocation()
  const [cookieAccepted, setCookieAccepted] = useState(
    () => localStorage.getItem('oa_cookie') === '1'
  )
  const [mobileOpen, setMobileOpen] = useState(false)
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setLang('en')} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: lang === 'en' ? 'var(--terracotta)' : 'transparent',
              color: lang === 'en' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)',
              cursor: 'pointer'
            }}>EN</button>
            <button onClick={() => setLang('id')} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              background: lang === 'id' ? 'var(--terracotta)' : 'transparent',
              color: lang === 'id' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)',
              cursor: 'pointer'
            }}>ID</button>
          </div>
          <Link to="/" style={{ fontSize: 14, fontWeight: 500, color: pathname === '/' ? 'var(--terracotta)' : 'var(--text)' }}>{tx.home}</Link>
          <Link to="/impact" style={{ fontSize: 14, fontWeight: 500, color: pathname === '/impact' ? 'var(--terracotta)' : 'var(--text)' }}>{tx.impact}</Link>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>{tx.login}</Link>
          <a href="mailto:info@openarms.org" className="btn btn-primary btn-sm">{tx.donate}</a>
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
