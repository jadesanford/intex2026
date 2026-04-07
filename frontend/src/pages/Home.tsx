import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Heart, Shield, BookOpen, Phone, MapPin, Users, TrendingUp, ArrowRight } from 'lucide-react'
import { getImpactSnapshot } from '../lib/api'

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

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

export default function Home({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  const { data } = useQuery({ queryKey: ['impact-snapshot'], queryFn: getImpactSnapshot })

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--beige) 0%, #fff 60%)',
        padding: '100px 24px 80px', textAlign: 'center'
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
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
            <a href="tel:+621234567890" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
              <Phone size={18} /> {tx.help}
            </a>
            <Link to="/impact" className="btn btn-outline" style={{ fontSize: 16, padding: '14px 32px' }}>
              <TrendingUp size={18} /> {tx.impact}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      {data && (
        <section style={{ background: 'var(--navy)', padding: '60px 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', color: 'white', marginBottom: 48, fontSize: 28 }}>{tx.statsTitle}</h2>
            <div className="grid-4">
              {[
                { v: data.totalResidentsHelped, l: tx.helped },
                { v: data.activeResidents, l: tx.active },
                { v: data.totalSafehouses, l: tx.safehouses },
                { v: data.reintegrationRate + '%', l: tx.reintegration },
              ].map(({ v, l }) => (
                <div key={l} style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'Playfair Display, serif' }}>{v}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mission */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 36, marginBottom: 20 }}>{tx.mission}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>{tx.missionText}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {tx.services.map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--terracotta)', flexShrink: 0 }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, var(--terracotta) 0%, var(--terracotta-dark) 100%)',
            borderRadius: 24, padding: 48, textAlign: 'center', color: 'white'
          }}>
            <Shield size={60} style={{ marginBottom: 20, opacity: 0.9 }} />
            <p style={{ fontSize: 18, fontStyle: 'italic', lineHeight: 1.8 }}>{tx.faithText}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--beige)', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, marginBottom: 16 }}>{tx.ctaTitle}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 17, marginBottom: 40 }}>{tx.ctaText}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:donate@openarms.org" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
              <Heart size={18} /> {tx.donate}
            </a>
            <a href="mailto:info@openarms.org" className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 16 }}>
              {tx.contact}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
