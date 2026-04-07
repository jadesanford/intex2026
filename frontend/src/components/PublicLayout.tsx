import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import PublicSiteNav from './PublicSiteNav'

interface Props {
  children: React.ReactNode
}

const t = {
  en: {
    cookieMsg: 'We use cookies to enhance your experience.',
    accept: 'Accept'
  },
  tl: {
    cookieMsg: 'Gumagamit kami ng cookies upang mapabuti ang inyong karanasan.',
    accept: 'Tanggapin'
  }
}

export default function PublicLayout({ children }: Props) {
  const { lang } = useLanguage()
  const [cookieAccepted, setCookieAccepted] = useState(() => localStorage.getItem('oa_cookie') === '1')
  const tx = t[lang]

  const acceptCookie = () => {
    localStorage.setItem('oa_cookie', '1')
    setCookieAccepted(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicSiteNav />

      <main style={{ flex: 1 }}>{children}</main>

      <footer
        style={{
          background: 'var(--navy)',
          color: 'rgba(255,255,255,0.7)',
          padding: '40px 24px',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Heart size={16} color="var(--terracotta)" fill="var(--terracotta)" />
          <span style={{ fontFamily: 'Playfair Display, serif', color: 'white', fontSize: 18 }}>Open Arms</span>
        </div>
        <p style={{ fontSize: 13, marginBottom: 12 }}>
          Supporting survivors of sexual abuse and trafficking in the Philippines.
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', fontSize: 13 }}>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Privacy Policy
          </Link>
          <Link to="/impact" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Our Impact
          </Link>
          <Link to="/donate" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Donate
          </Link>
          <a href="mailto:info@openarms.org" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Contact
          </a>
        </div>
        <p style={{ fontSize: 12, marginTop: 16 }}>© 2024 Open Arms. All rights reserved.</p>
      </footer>

      {!cookieAccepted && (
        <div className="cookie-banner">
          <span>
            {tx.cookieMsg}{' '}
            <Link to="/privacy" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
              Learn more
            </Link>
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={acceptCookie}>
            {tx.accept}
          </button>
        </div>
      )}
    </div>
  )
}
