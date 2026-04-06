import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDonations, getDonationSummary, getSupporters, createDonation } from '../../lib/api'
import { Plus, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatIDR(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}M`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function Donations() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ supporterId: '', amount: '', currency: 'IDR', donationType: 'bank_transfer', campaign: '', channel: 'website', donatedAt: new Date().toISOString().slice(0, 10), receiptIssued: 'false', notes: '' })

  const { data: donations, isLoading } = useQuery({ queryKey: ['all-donations'], queryFn: () => getDonations({ pageSize: 100 }) })
  const { data: summary } = useQuery({ queryKey: ['donation-summary'], queryFn: getDonationSummary })
  const { data: supporters } = useQuery({ queryKey: ['supporters'], queryFn: () => getSupporters() })

  const create = useMutation({
    mutationFn: () => createDonation({ ...form, supporterId: form.supporterId ? +form.supporterId : null, amount: form.amount ? +form.amount : null, receiptIssued: form.receiptIssued === 'true' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-donations'] }); qc.invalidateQueries({ queryKey: ['donation-summary'] }); setShowModal(false) }
  })

  const chartData = (summary?.monthly ?? []).map((m: { month: string; total: number }) => ({
    month: m.month?.slice(5), amount: Math.round(m.total / 1_000_000)
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
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--sage)' }}>{formatIDR(summary.total || 0)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Total Donations</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--terracotta)' }}>{summary.count}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Total Transactions</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>{formatIDR(summary.count > 0 ? (summary.total / summary.count) : 0)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Average Gift</div>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Monthly Donation Trend (Rp Million)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}M`} />
              <Tooltip formatter={(v: number) => [`Rp ${v}M`, 'Total']} />
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
                <thead><tr><th>Date</th><th>Donor</th><th>Amount</th><th>Type</th><th>Campaign</th><th>Channel</th><th>Receipt</th></tr></thead>
                <tbody>
                  {(donations ?? []).map((d: { id: number; donatedAt: string; supporters?: { name: string }; amount: number; currency: string; donationType: string; campaign: string; channel: string; receiptIssued: boolean }) => (
                    <tr key={d.id}>
                      <td style={{ fontSize: 13 }}>{d.donatedAt?.slice(0, 10)}</td>
                      <td style={{ fontWeight: 500 }}>{d.supporters?.name || 'Anonymous'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--sage)' }}>{formatIDR(d.amount || 0)}</td>
                      <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{d.donationType}</td>
                      <td style={{ fontSize: 13 }}>{d.campaign || '—'}</td>
                      <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{d.channel || '—'}</td>
                      <td style={{ fontSize: 13 }}>{d.receiptIssued ? <span style={{ color: 'var(--success)' }}>✓</span> : '—'}</td>
                    </tr>
                  ))}
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
                  {(supporters ?? []).map((s: { id: number; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Amount (IDR) *</label><input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" /></div>
              <div className="form-group"><label>Date</label><input type="date" value={form.donatedAt} onChange={e => setForm(p => ({ ...p, donatedAt: e.target.value }))} /></div>
              <div className="form-group"><label>Type</label>
                <select value={form.donationType} onChange={e => setForm(p => ({ ...p, donationType: e.target.value }))}>
                  {['bank_transfer', 'online', 'cash', 'in_kind', 'check'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Channel</label>
                <select value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}>
                  {['website', 'bank_transfer', 'corporate', 'church', 'referral', 'foundation', 'direct'].map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Campaign</label><input value={form.campaign} onChange={e => setForm(p => ({ ...p, campaign: e.target.value }))} placeholder="e.g. Year-end Appeal" /></div>
              <div className="form-group"><label>Receipt Issued</label>
                <select value={form.receiptIssued} onChange={e => setForm(p => ({ ...p, receiptIssued: e.target.value }))}>
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
