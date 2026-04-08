import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, TrendingUp } from 'lucide-react'
import { sendQuickHelpRequest } from '../lib/api'

const t = {
  en: {
    badge: 'A safe place to heal',
    title: 'Open Arms',
    subtitle: 'Supporting girls who are survivors of sexual abuse and trafficking in the Philippines.',
    help: 'Get Help Now',
    impact: 'See Our Impact',
    mission: 'Our Mission',
    missionText: 'Open Arms provides comprehensive care, healing, and reintegration support for survivors of sexual abuse and trafficking. We walk alongside every girl on her journey to restoration and dignity.',
    services: ['Safe Shelter & Housing', 'Trauma Counseling', 'Education & Vocational Training', 'Legal Support', 'Family Reintegration', 'Health & Wellness'],
    statsTitle: 'Our Impact in Numbers',
    helped: 'Girls Helped',
    active: 'Currently in Care',
    safehouses: 'Safe Locations',
    reintegration: 'Reintegration Rate',
    faithTitle: 'Hope & Restoration',
    faithText: '"He heals the brokenhearted and binds up their wounds." — Psalm 147:3',
    faithSub: 'Every girl who walks through our doors carries immeasurable value. We believe in the possibility of complete healing and restoration.',
    ctaTitle: 'Be Part of the Story',
    ctaText: 'Your support makes restoration possible for survivors across the Philippines.',
    donate: 'Support Our Work',
    contact: 'Contact Us',
  },
  tl: {
    badge: 'Isang ligtas na lugar para gumaling',
    title: 'Open Arms',
    subtitle: 'Tumutulong sa mga batang babaeng nakaligtas sa sekswal na pang-aabuso at trafficking sa Pilipinas.',
    help: 'Humingi ng Tulong',
    impact: 'Tingnan ang Aming Epekto',
    mission: 'Aming Misyon',
    missionText: 'Ang Open Arms ay nagbibigay ng komprehensibong pag-aalaga, pagpapagaling, at suporta sa muling pagsasama para sa mga nakaligtas sa sekswal na pang-aabuso at trafficking. Sinasamahan namin ang bawat batang babae sa kanyang paglalakbay tungo sa pagpapanumbalik at dignidad.',
    services: ['Ligtas na Tirahan', 'Konseling sa Trauma', 'Edukasyon at Bokasyonal na Pagsasanay', 'Legal na Tulong', 'Muling Pagsasama ng Pamilya', 'Kalusugan at Kagalingan'],
    statsTitle: 'Aming Epekto sa mga Numero',
    helped: 'Mga Batang Babae na Natulungan',
    active: 'Kasalukuyang sa Pag-aalaga',
    safehouses: 'Ligtas na Lokasyon',
    reintegration: 'Antas ng Muling Pagsasama',
    faithTitle: 'Pag-asa at Pagpapanumbalik',
    faithText: '"Pinagagaling niya ang mga may pusong nasira at binibigkis ang kanilang mga sugat." — Awit 147:3',
    faithSub: 'Bawat batang babaeng dumarating sa aming pinto ay may walang kapantay na halaga. Naniniwala kami sa posibilidad ng kumpletong pagpapagaling at pagpapanumbalik.',
    ctaTitle: 'Maging Bahagi ng Kwento',
    ctaText: 'Ang inyong suporta ay nagbibigay ng pagbabago para sa mga nakaligtas sa buong Pilipinas.',
    donate: 'Suportahan ang Aming Gawain',
    contact: 'Makipag-ugnayan sa Amin',
  }
}

export default function Home({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  const [showHelpForm, setShowHelpForm] = useState(false)
  const [helpName, setHelpName] = useState('')
  const [helpEmail, setHelpEmail] = useState('')
  const [helpPhone, setHelpPhone] = useState('')
  const [helpMessage, setHelpMessage] = useState('')
  const [sendingHelp, setSendingHelp] = useState(false)
  const [helpNotice, setHelpNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const submitQuickHelp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!helpMessage.trim()) return

    try {
      setSendingHelp(true)
      const response = await sendQuickHelpRequest({
        name: helpName,
        email: helpEmail,
        phone: helpPhone,
        message: helpMessage
      })
      setShowHelpForm(false)
      setHelpName('')
      setHelpEmail('')
      setHelpPhone('')
      setHelpMessage('')
      setHelpNotice({ type: 'success', text: response?.message ?? 'Your request was sent successfully.' })
    } catch {
      setHelpNotice({ type: 'error', text: 'Could not send your request right now. Please try again in a moment.' })
    } finally {
      setSendingHelp(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--beige) 0%, #fff 60%)',
        padding: '100px 24px 80px', textAlign: 'center'
      }}>
        <img
          src="/hero-bg.png"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top', opacity: 0.18, pointerEvents: 'none'
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(193,105,79,0.1)', color: 'var(--terracotta)',
            padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, marginBottom: 24
          }}>
            <Heart size={14} fill="currentColor" /> {tx.badge}
          </span>
          <h1 style={{ fontSize: 'clamp(48px, 8vw, 80px)', marginBottom: 20, color: 'var(--navy)' }}>{tx.title}</h1>
          <p style={{ fontSize: 20, color: 'var(--text-muted)', marginBottom: 40, lineHeight: 1.7 }}>{tx.subtitle}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }} onClick={() => setShowHelpForm(true)}>
              <Heart size={18} /> {tx.help}
            </button>
            <Link to="/impact" className="btn btn-outline" style={{ fontSize: 16, padding: '14px 32px' }}>
              <TrendingUp size={18} /> {tx.impact}
            </Link>
          </div>
          {showHelpForm && (
            <div className="modal-overlay" onClick={() => setShowHelpForm(false)}>
              <form onSubmit={submitQuickHelp} className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Quick Help Form</h2>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowHelpForm(false)}>✕</button>
                </div>
                <div className="grid-2" style={{ marginBottom: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Name</label>
                    <input value={helpName} onChange={e => setHelpName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Email</label>
                    <input type="email" value={helpEmail} onChange={e => setHelpEmail(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Phone</label>
                    <input value={helpPhone} onChange={e => setHelpPhone(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label>How can we help?</label>
                    <textarea rows={3} required value={helpMessage} onChange={e => setHelpMessage(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowHelpForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={sendingHelp}>
                    {sendingHelp ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          )}
          {helpNotice && (
            <div className="modal-overlay" onClick={() => setHelpNotice(null)}>
              <div className={`quick-help-notice ${helpNotice.type}`} onClick={e => e.stopPropagation()}>
                <h3>{helpNotice.type === 'success' ? 'Message Sent' : 'Could Not Send Message'}</h3>
                <p>{helpNotice.text}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-primary" onClick={() => setHelpNotice(null)}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mission */}
      <section className="home-mission-section" style={{ background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="mission-grid">
            <div className="mission-content">
              <h2 className="mission-title">{tx.mission}</h2>
              <p className="mission-text">{tx.missionText}</p>
              <div className="mission-services-grid">
                {tx.services.map(s => (
                  <div key={s} className="mission-service-item">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--terracotta)', flexShrink: 0 }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div className="mission-quote-card">
              <p style={{ fontSize: 18, fontStyle: 'italic', lineHeight: 1.8 }}>{tx.faithText}</p>
            </div>
          </div>
          <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
            <img
              src="/christ.png"
              alt="Christ with open arms"
              style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 300 }}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--beige)', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, marginBottom: 16 }}>{tx.ctaTitle}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 17, marginBottom: 40 }}>{tx.ctaText}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/donate" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
              <Heart size={18} /> {tx.donate}
            </Link>
            <a href="mailto:info@openarms.org" className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 16 }}>
              {tx.contact}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
