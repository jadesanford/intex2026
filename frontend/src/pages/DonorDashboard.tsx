import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, PhilippinePeso, Calendar, TrendingUp, RotateCcw } from 'lucide-react'
import { getDonorDonations } from '../lib/api'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}K`
  return `₱${n.toLocaleString()}`
}

type Donation = {
  donationId: number; donationDate: string; amount: number; donationType: string;
  channelSource: string; campaignName: string; isRecurring: boolean; notes: string;
}

const t = {
  en: {
    title: 'My Donor Dashboard',
    subtitle: "Track your giving and see the impact you've made.",
    totalGiven: 'Total Given',
    donationsMade: 'Donations Made',
    recurring: 'Recurring Gifts',
    makeDonation: 'Make a Donation',
    backToSite: 'Back to Site',
    donationHistory: 'Donation History',
    noDonations: 'No donations yet',
    makeFirst: 'Make your first donation to see it here.',
    amount: 'Amount',
    campaign: 'Campaign',
    channel: 'Channel',
    recurringCol: 'Recurring',
    oneTime: 'One-time',
    monthly: '✓ Monthly',
    date: 'Date',
  },
  tl: {
    title: 'Aking Donor Dashboard',
    subtitle: 'Subaybayan ang iyong mga donasyon at epekto.',
    totalGiven: 'Kabuuang Naibigay',
    donationsMade: 'Bilang ng Donasyon',
    recurring: 'Paulit-ulit na Donasyon',
    makeDonation: 'Magbigay ng Donasyon',
    backToSite: 'Bumalik sa Site',
    donationHistory: 'Kasaysayan ng Donasyon',
    noDonations: 'Wala pang donasyon',
    makeFirst: 'Magbigay ng una mong donasyon para makita rito.',
    amount: 'Halaga',
    campaign: 'Kampanya',
    channel: 'Pinagmulan',
    recurringCol: 'Paulit-ulit',
    oneTime: 'Isang beses',
    monthly: '✓ Buwan-buwan',
    date: 'Petsa',
  }
}

export default function DonorDashboard({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  const navigate = useNavigate()

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: getDonorDonations
  })

  const totalGiven = (donations as Donation[])
    .filter(d => d.donationType === 'Monetary')
    .reduce((sum, d) => sum + (d.amount || 0), 0)

  const recurringCount = (donations as Donation[]).filter(d => d.isRecurring).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--beige)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, color: 'var(--navy)', marginBottom: 8 }}>{tx.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{tx.subtitle}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(193,105,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <PhilippinePeso size={22} color="var(--terracotta)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'Playfair Display, serif' }}>{formatPHP(totalGiven)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{tx.totalGiven}</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(74,111,95,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <TrendingUp size={22} color="var(--sage)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>{(donations as Donation[]).length}</div>
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

        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => navigate('/donate')}>
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
          ) : (donations as Donation[]).length === 0 ? (
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
                    <th><Calendar size={13} style={{ marginRight: 4 }} />{tx.date}</th>
                    <th>{tx.amount}</th>
                    <th>{tx.campaign}</th>
                    <th>{tx.channel}</th>
                    <th>{tx.recurringCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {(donations as Donation[]).map(d => (
                    <tr key={d.donationId}>
                      <td style={{ fontSize: 13 }}>{d.donationDate?.slice(0, 10)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--sage)' }}>
                        {d.amount ? formatPHP(d.amount) : '—'}
                      </td>
                      <td style={{ fontSize: 13 }}>{d.campaignName || '—'}</td>
                      <td style={{ fontSize: 13 }}>{d.channelSource || '—'}</td>
                      <td>{d.isRecurring ? <span style={{ color: 'var(--sage)', fontWeight: 600 }}>{tx.monthly}</span> : <span style={{ color: 'var(--text-muted)' }}>{tx.oneTime}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
