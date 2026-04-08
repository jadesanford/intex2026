import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, PhilippinePeso, Calendar, TrendingUp, RotateCcw, ChevronRight, Package } from 'lucide-react'
import { getDonorDonations } from '../lib/api'
import { donationTypeIsInKind } from '../lib/inKindDonationItems'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}K`
  return `₱${n.toLocaleString()}`
}

type Donation = {
  donationId: number
  donationDate: string
  amount?: number
  estimatedValue?: number
  donationType: string
  channelSource?: string
  campaignName?: string
  currencyCode?: string
  impactUnit?: string
  isRecurring?: boolean
  notes?: string
}

function donationDisplayValue(d: Donation): string {
  if (d.donationType === 'Monetary') {
    return d.amount != null && d.amount > 0 ? formatPHP(d.amount) : '—'
  }
  const ev = Number(d.estimatedValue)
  return Number.isFinite(ev) && ev > 0 ? formatPHP(ev) : '—'
}

function truncate(s: string, max: number) {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

const t = {
  en: {
    title: 'My Donor Dashboard',
    subtitle: "Track your giving and see the impact you've made.",
    totalGiven: 'Total Given',
    donationsMade: 'Donations Made',
    recurring: 'Recurring Gifts',
    otherGiftsEst: 'Estimated value of in-kind and other non-cash gifts',
    makeDonation: 'Make a Donation',
    backToSite: 'Back to Site',
    donationHistory: 'Donation History',
    noDonations: 'No donations yet',
    makeFirst: 'Make your first donation to see it here.',
    type: 'Type',
    value: 'Value',
    campaign: 'Campaign',
    channel: 'Channel',
    impact: 'Impact',
    recurringCol: 'Recurring',
    notes: 'Notes',
    oneTime: 'One-time',
    monthly: '✓ Monthly',
    date: 'Date',
    viewDetails: 'Details',
    viewInKind: 'View items',
    thankYouTitle: 'Thank you for your generosity.',
    thankYouBody: 'Your donations help provide safe shelter, trauma-informed care, education support, and reintegration services for survivors. Every gift directly strengthens healing journeys and long-term recovery in our community.',
  },
  tl: {
    title: 'Aking Donor Dashboard',
    subtitle: 'Subaybayan ang iyong mga donasyon at epekto.',
    totalGiven: 'Kabuuang Naibigay',
    donationsMade: 'Bilang ng Donasyon',
    recurring: 'Paulit-ulit na Donasyon',
    otherGiftsEst: 'Tinatayang halaga ng in-kind at iba pang hindi pera',
    makeDonation: 'Magbigay ng Donasyon',
    backToSite: 'Bumalik sa Site',
    donationHistory: 'Kasaysayan ng Donasyon',
    noDonations: 'Wala pang donasyon',
    makeFirst: 'Magbigay ng una mong donasyon para makita rito.',
    type: 'Uri',
    value: 'Halaga',
    campaign: 'Kampanya',
    channel: 'Pinagmulan',
    impact: 'Epekto',
    recurringCol: 'Paulit-ulit',
    notes: 'Mga tala',
    oneTime: 'Isang beses',
    monthly: '✓ Buwan-buwan',
    date: 'Petsa',
    viewDetails: 'Detalye',
    viewInKind: 'Tingnan ang mga item',
    thankYouTitle: 'Maraming salamat sa inyong kabutihang-loob.',
    thankYouBody: 'Ang inyong mga donasyon ay tumutulong sa ligtas na tirahan, trauma-informed na pag-aalaga, suporta sa edukasyon, at mga serbisyong reintegration para sa mga survivor. Bawat handog ay nagpapalakas ng kanilang paghilom at pangmatagalang pagbangon sa komunidad.',
  }
}

export default function DonorDashboard({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  const navigate = useNavigate()

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: getDonorDonations
  })

  const list = donations as Donation[]

  const totalGiven = list
    .filter(d => d.donationType === 'Monetary')
    .reduce((sum, d) => sum + (d.amount || 0), 0)

  const otherEstimated = list
    .filter(d => d.donationType !== 'Monetary')
    .reduce((sum, d) => sum + (Number(d.estimatedValue) || 0), 0)

  const recurringCount = list.filter(d => d.isRecurring).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--beige)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, color: 'var(--navy)', marginBottom: 8 }}>{tx.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{tx.subtitle}</p>
        </div>

        <div className="donor-kpi-grid" style={{ marginBottom: 20 }}>
          <div className="card donor-kpi-total" style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(193,105,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <PhilippinePeso size={22} color="var(--terracotta)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'Playfair Display, serif' }}>{formatPHP(totalGiven)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{tx.totalGiven}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>({lang === 'tl' ? 'pera lamang' : 'cash only'})</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(74,111,95,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <TrendingUp size={22} color="var(--sage)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>{list.length}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{tx.donationsMade}</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(26,54,93,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <RotateCcw size={22} color="var(--navy)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}>{recurringCount}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{tx.recurring}</div>
          </div>
        </div>

        {otherEstimated > 0 && (
          <div className="card" style={{ marginBottom: 24, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Package size={20} color="var(--terracotta)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tx.otherGiftsEst}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>{formatPHP(otherEstimated)}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" style={{ gap: 8 }} onClick={() => navigate('/donate')}>
            <Heart size={16} /> {tx.makeDonation}
          </button>
          <Link to="/" className="btn btn-outline">{tx.backToSite}</Link>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 18, color: 'var(--navy)' }}>{tx.donationHistory}</h2>
          </div>
          {isLoading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : list.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Heart size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 16, marginBottom: 8 }}>{tx.noDonations}</p>
              <p style={{ fontSize: 14 }}>{tx.makeFirst}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th><Calendar size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{tx.date}</th>
                    <th>{tx.type}</th>
                    <th>{tx.value}</th>
                    <th>{tx.campaign}</th>
                    <th>{tx.channel}</th>
                    <th>{tx.impact}</th>
                    <th>{tx.recurringCol}</th>
                    <th>{tx.notes}</th>
                    <th style={{ minWidth: 100 }} />
                  </tr>
                </thead>
                <tbody>
                  {list.map(d => {
                    const inKind = donationTypeIsInKind(d.donationType)
                    return (
                      <tr key={d.donationId}>
                        <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{d.donationDate?.slice(0, 10)}</td>
                        <td>
                          <span className={d.donationType === 'Monetary' ? 'badge badge-green' : 'badge badge-blue'} style={{ fontSize: 11 }}>
                            {d.donationType || '—'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--sage)', fontSize: 13, whiteSpace: 'nowrap' }}>
                          {donationDisplayValue(d)}
                        </td>
                        <td style={{ fontSize: 13, maxWidth: 140 }}>{d.campaignName || '—'}</td>
                        <td style={{ fontSize: 13 }}>{d.channelSource || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.impactUnit || '—'}</td>
                        <td style={{ fontSize: 12 }}>
                          {d.isRecurring ? <span style={{ color: 'var(--sage)', fontWeight: 600 }}>{tx.monthly}</span> : <span style={{ color: 'var(--text-muted)' }}>{tx.oneTime}</span>}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 160 }} title={d.notes || undefined}>
                          {d.notes ? truncate(d.notes, 48) : '—'}
                        </td>
                        <td>
                          <Link
                            to={`/donor/donations/${d.donationId}`}
                            className="btn btn-ghost btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                          >
                            {inKind ? tx.viewInKind : tx.viewDetails}
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.7 }}>
            <strong>{tx.thankYouTitle}</strong> {tx.thankYouBody}
          </p>
        </div>
      </div>
    </div>
  )
}
