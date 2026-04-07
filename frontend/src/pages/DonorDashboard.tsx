import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, LogOut, PhilippinePeso, Calendar, TrendingUp, RotateCcw } from 'lucide-react'
import { getDonorDonations } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}K`
  return `₱${n.toLocaleString()}`
}

type Donation = {
  donationId: number; donationDate: string; amount: number; donationType: string;
  channelSource: string; campaignName: string; isRecurring: boolean; notes: string;
}

export default function DonorDashboard() {
  const { user, logout } = useAuth()
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
      <nav style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--navy)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={18} fill="white" color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, fontFamily: 'Playfair Display, serif' }}>Open Arms</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Welcome, <strong style={{ color: 'var(--navy)' }}>{user?.displayName}</strong></span>
            <button className="btn btn-ghost btn-sm" onClick={logout} style={{ gap: 6 }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, color: 'var(--navy)', marginBottom: 8 }}>My Donor Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track your giving and see the impact you've made.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(193,105,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <PhilippinePeso size={22} color="var(--terracotta)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'Playfair Display, serif' }}>{formatPHP(totalGiven)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Total Given</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(74,111,95,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <TrendingUp size={22} color="var(--sage)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>{(donations as Donation[]).length}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Donations Made</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(26,54,93,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <RotateCcw size={22} color="var(--navy)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Playfair Display, serif' }}>{recurringCount}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Recurring Gifts</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => navigate('/donate')}>
            <Heart size={16} /> Make a Donation
          </button>
          <Link to="/" className="btn btn-outline">Back to Site</Link>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 18, color: 'var(--navy)' }}>Donation History</h2>
          </div>
          {isLoading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (donations as Donation[]).length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Heart size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontSize: 16, marginBottom: 8 }}>No donations yet</p>
              <p style={{ fontSize: 14 }}>Make your first donation to see it here.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th><Calendar size={13} style={{ marginRight: 4 }} />Date</th>
                    <th>Amount</th>
                    <th>Campaign</th>
                    <th>Channel</th>
                    <th>Recurring</th>
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
                      <td>{d.isRecurring ? <span style={{ color: 'var(--sage)', fontWeight: 600 }}>✓ Monthly</span> : <span style={{ color: 'var(--text-muted)' }}>One-time</span>}</td>
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
