import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDonations, getDonationSummary, getSupporters, createDonation } from '../../lib/api'
import { Plus, PhilippinePeso } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

type DonationRow = {
  donationId: number; donationDate: string; channelSource: string; campaignName: string;
  donationType: string; amount: number; estimatedValue: number; currencyCode: string; isRecurring: boolean;
  supporters?: { displayName: string; organizationName: string; supporterType: string }
}

type SupporterRow = { supporterId: number; displayName: string; organizationName: string }

export default function Donations() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    supporterId: '', amount: '', donationType: 'Monetary', channelSource: 'Website',
    campaignName: '', donationDate: new Date().toISOString().slice(0, 10),
    isRecurring: 'false', notes: ''
  })

  const { data: donations, isLoading } = useQuery({
    queryKey: ['all-donations'],
    queryFn: () => getDonations({ pageSize: 100 })
  })
  const { data: summary } = useQuery({ queryKey: ['donation-summary'], queryFn: getDonationSummary })
  const { data: supporters } = useQuery({ queryKey: ['supporters'], queryFn: () => getSupporters() })

  const create = useMutation({
    mutationFn: () => createDonation({
      supporterId: form.supporterId ? +form.supporterId : null,
      amount: form.amount ? +form.amount : null,
      donationType: form.donationType,
      channelSource: form.channelSource,
      campaignName: form.campaignName,
      donationDate: form.donationDate,
      isRecurring: form.isRecurring === 'true',
      currencyCode: 'PHP',
      notes: form.notes
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-donations'] })
      qc.invalidateQueries({ queryKey: ['donation-summary'] })
      setShowModal(false)
    }
  })

  const chartData = (summary?.monthly ?? []).map((m: { month: string; total: number }) => ({
    month: m.month?.slice(5), amount: Math.round(m.total / 1_000)
  })).slice(-8)

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 28 }}>Donations</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Record Donation</button>
      </div>

      {summary && (
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--sage)' }}>{formatPHP(summary.total || 0)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Total Monetary</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--terracotta)' }}>{summary.count}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Total Records</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>
              {formatPHP(summary.count > 0 && summary.monetary > 0 ? (summary.total / summary.monetary) : 0)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Average Gift</div>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Monthly Donation Trend (₱ Thousands)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₱${v}K`} />
              <Tooltip formatter={(v: number) => [`₱${v}K`, 'Total']} />
              <Bar dataKey="amount" fill="var(--terracotta)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="loading-center"><div className="spinner" /></div>
          : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Date</th><th>Donor</th><th>Amount</th><th>Type</th><th>Campaign</th><th>Channel</th><th>Recurring</th></tr></thead>
                <tbody>
                  {(donations ?? []).map((d: DonationRow) => {
                    const donorName = d.supporters?.displayName || d.supporters?.organizationName || 'Anonymous'
                    const val = d.donationType === 'Monetary' ? d.amount : d.estimatedValue
                    return (
                      <tr key={d.donationId}>
                        <td style={{ fontSize: 13 }}>{d.donationDate?.slice(0, 10)}</td>
                        <td style={{ fontWeight: 500 }}>{donorName}</td>
                        <td style={{ fontWeight: 700, color: 'var(--sage)' }}>{val ? formatPHP(val) : '—'}</td>
                        <td><span className={d.donationType === 'Monetary' ? 'badge badge-green' : 'badge badge-blue'}>{d.donationType}</span></td>
                        <td style={{ fontSize: 13 }}>{d.campaignName || '—'}</td>
                        <td style={{ fontSize: 13 }}>{d.channelSource || '—'}</td>
                        <td style={{ fontSize: 13 }}>{d.isRecurring ? <span style={{ color: 'var(--success)' }}>✓</span> : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Record Donation</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Donor</label>
                <select value={form.supporterId} onChange={e => setForm(p => ({ ...p, supporterId: e.target.value }))}>
                  <option value="">Anonymous</option>
                  {(supporters ?? []).map((s: SupporterRow) => (
                    <option key={s.supporterId} value={s.supporterId}>{s.displayName || s.organizationName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label>Amount (₱)</label><input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" /></div>
              <div className="form-group"><label>Date</label><input type="date" value={form.donationDate} onChange={e => setForm(p => ({ ...p, donationDate: e.target.value }))} /></div>
              <div className="form-group"><label>Type</label>
                <select value={form.donationType} onChange={e => setForm(p => ({ ...p, donationType: e.target.value }))}>
                  {['Monetary', 'InKind'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Channel</label>
                <select value={form.channelSource} onChange={e => setForm(p => ({ ...p, channelSource: e.target.value }))}>
                  {['Website', 'BankTransfer', 'GCash', 'Maya', 'Church', 'Corporate', 'DirectGiving', 'Event', 'SocialMedia', 'PartnerReferral'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Campaign</label><input value={form.campaignName} onChange={e => setForm(p => ({ ...p, campaignName: e.target.value }))} placeholder="e.g. Year-end Appeal" /></div>
              <div className="form-group"><label>Recurring</label>
                <select value={form.isRecurring} onChange={e => setForm(p => ({ ...p, isRecurring: e.target.value }))}>
                  <option value="false">No</option><option value="true">Yes</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => create.mutate()} disabled={!form.amount || create.isPending}>{create.isPending ? 'Saving...' : 'Record Donation'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
