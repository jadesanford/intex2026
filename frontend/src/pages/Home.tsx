import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, TrendingUp, Target } from 'lucide-react'
import { sendQuickHelpRequest, getDonationYearProgress } from '../lib/api'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${Math.round(n).toLocaleString()}`
}

/** Display-only; override with VITE_PHP_PER_USD (pesos per one US dollar). */
const PHP_PER_USD_EST =
  typeof import.meta.env.VITE_PHP_PER_USD === 'string' && Number(import.meta.env.VITE_PHP_PER_USD) > 0
    ? Number(import.meta.env.VITE_PHP_PER_USD)
    : 57

function formatUsdApproxFromPhp(php: number): string {
  if (!Number.isFinite(php) || php < 0) return '—'
  const usd = php / PHP_PER_USD_EST
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`
  if (usd >= 1_000) return `$${Math.round(usd / 1000)}k`
  return `$${Math.round(usd).toLocaleString()}`
}

function PhpWithUsdApprox({
  php,
  large,
  usdHint,
}: {
  php: number
  large: boolean
  usdHint: string
}) {
  return (
    <div
      style={{
        fontSize: large ? 28 : 20,
        fontWeight: large ? 800 : 700,
        color: large ? 'var(--terracotta)' : 'var(--navy)',
        fontFamily: large ? 'Playfair Display, serif' : undefined,
        lineHeight: 1.25,
      }}
    >
      <span>{formatPHP(php)}</span>
      <span
        title={usdHint}
        style={{
          fontSize: large ? 16 : 14,
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginLeft: 6,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        ({formatUsdApproxFromPhp(php)})
      </span>
    </div>
  )
}

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
    donorDriveBadge: 'Together this year',
    donorDriveTitle: 'Your gifts keep our doors open for every girl',
    donorDriveLead:
      'Monetary donations this calendar year are tracked toward an annual goal so we can plan shelter beds, counseling, education, and reintegration support with confidence.',
    donorDriveUsesTitle: 'What your support provides',
    donorDriveUses: [
      'Safe shelter, meals, and 24/7 care in our locations',
      'Trauma-informed counseling and case management',
      'School fees, tutoring, and vocational training',
      'Medical care, legal aid, and family reintegration support',
    ],
    donorDriveRaised: 'Raised in {year}',
    donorDriveGoal: 'Annual goal',
    donorDriveOfGoal: '{pct}% of goal',
    donorDriveMet: 'Goal reached — thank you! Every extra gift still goes directly to the girls.',
    donorDriveGive: 'Give today',
    donorDriveLoadError: 'Live totals are unavailable right now; you can still give — every peso helps.',
    donorDriveUsdHint:
      `Approximate US dollars for reference only (~₱${PHP_PER_USD_EST} per US$1; not a live bank rate).`,
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
    donorDriveBadge: 'Sama-sama ngayong taon',
    donorDriveTitle: 'Ang inyong regalo ay nagpapatuloy sa aming pintuan para sa bawat batang babae',
    donorDriveLead:
      'Ang monetary na donasyon sa taong kalendaryo ay sinusubaybayan tungo sa taunang layunin upang mas maplano namin ang tirahan, konseling, edukasyon, at suporta sa muling pagsasama.',
    donorDriveUsesTitle: 'Ano ang binibigay ng inyong suporta',
    donorDriveUses: [
      'Ligtas na tirahan, pagkain, at 24/7 na pag-aalaga',
      'Konseling na may kaalaman sa trauma at case management',
      'Matrikula, tutoring, at bokasyonal na pagsasanay',
      'Medikal, legal na tulong, at suporta sa muling pagsasama ng pamilya',
    ],
    donorDriveRaised: 'Nakolekta sa {year}',
    donorDriveGoal: 'Taunang layunin',
    donorDriveOfGoal: '{pct}% ng layunin',
    donorDriveMet: 'Naabot ang layunin — salamat! Ang karagdagang donasyon ay diretso pa rin sa mga batang babae.',
    donorDriveGive: 'Mag-donate ngayon',
    donorDriveLoadError: 'Hindi available ang live na datos; maaari pa ring mag-donate — bawat piso ay tumutulong.',
    donorDriveUsdHint:
      `Tinatayang US dollars para sanggunian lamang (~₱${PHP_PER_USD_EST} kada US$1; hindi live na palitan).`,
  }
}

export default function Home({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  const { data: yearProgress, isError: yearProgressError } = useQuery({
    queryKey: ['public-donation-year-progress'],
    queryFn: getDonationYearProgress,
    staleTime: 60_000,
  })
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
        background: 'linear-gradient(135deg, var(--beige) 0%, var(--surface-1) 60%)',
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
      <section className="home-mission-section">
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

      {/* Donor drive — YTD vs goal (after mission) */}
      <section className="home-donation-drive-section" aria-labelledby="home-donor-drive-heading">
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'color-mix(in srgb, var(--terracotta) 18%, transparent)',
                color: 'var(--terracotta)',
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Target size={15} aria-hidden /> {tx.donorDriveBadge}
            </span>
          </div>
          <h2 id="home-donor-drive-heading" style={{ fontSize: 'clamp(26px, 5vw, 36px)', color: 'var(--navy)', marginBottom: 14, lineHeight: 1.2 }}>
            {tx.donorDriveTitle}
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 28, maxWidth: 720 }}>
            {tx.donorDriveLead}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 28,
              alignItems: 'start',
              marginBottom: 32,
            }}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>{tx.donorDriveUsesTitle}</h3>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tx.donorDriveUses.map((line) => (
                  <li key={line} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: 'var(--text)', lineHeight: 1.55 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--terracotta)', marginTop: 7, flexShrink: 0 }} aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div
              style={{
                background: 'var(--surface-1)',
                borderRadius: 16,
                padding: 24,
                border: '1px solid var(--border)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
              }}
            >
              {yearProgressError ? (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{tx.donorDriveLoadError}</p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {tx.donorDriveRaised.replace('{year}', String(yearProgress?.year ?? new Date().getUTCFullYear()))}
                      </div>
                      <div>
                        {yearProgress != null ? (
                          <PhpWithUsdApprox php={Number(yearProgress.raisedPhp)} large usdHint={tx.donorDriveUsdHint} />
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {tx.donorDriveGoal}
                      </div>
                      <div>
                        {yearProgress != null ? (
                          <PhpWithUsdApprox php={Number(yearProgress.goalPhp)} large={false} usdHint={tx.donorDriveUsdHint} />
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className="home-donation-progress-track"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={yearProgress != null ? Math.round(Number(yearProgress.percentTowardGoal)) : 0}
                    aria-label={tx.donorDriveGoal}
                  >
                    <div
                      className="home-donation-progress-fill"
                      style={{
                        width: yearProgress != null ? `${Math.min(100, Number(yearProgress.percentTowardGoal))}%` : '0%',
                      }}
                    />
                  </div>
                  <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                    {yearProgress != null &&
                    Number(yearProgress.raisedPhp) >= Number(yearProgress.goalPhp)
                      ? tx.donorDriveMet
                      : yearProgress != null
                        ? tx.donorDriveOfGoal.replace('{pct}', String(yearProgress.percentTowardGoal))
                        : '\u00a0'}
                  </p>
                </>
              )}
              <Link
                to="/donate"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '12px 20px', fontSize: 15 }}
              >
                <Heart size={18} /> {tx.donorDriveGive}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — Be Part of the Story */}
      <section className="home-story-cta-section">
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
