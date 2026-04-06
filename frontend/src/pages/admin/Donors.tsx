import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getSupporters, createSupporter } from '../../lib/api'
import { Plus, Heart, AlertCircle, Search } from 'lucide-react'

function formatIDR(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}M`
  return `Rp ${n.toLocaleString('id-ID')}`
}

const TYPE_BADGE: Record<string, string> = {
  individual: 'badge badge-blue', corporate: 'badge badge-purple',
  church: 'badge badge-green', foundation: 'badge badge-orange'
}

export default function Donors() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', type: 'individual', country: 'Indonesia', city: '', isRecurring: 'false', notes: '', status: 'active' })

  const { data: supporters, isLoading } = useQuery({
    queryKey: ['supporters', typeFilter],
    queryFn: () => getSupporters(typeFilter ? { type: typeFilter } : undefined)
  })

  const create = useMutation({
    mutationFn: () => createSupporter({ ...form, isRecurring: form.isRecurring === 'true' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['supporters'] }); setShowModal(false) }
  })

  const filtered = (supporters ?? []).filter((s: { name: string; email?: string }) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const lapsing = filtered.filter((s: { lapsing?: boolean }) => s.lapsing)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Donors & Supporters</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{filtered.length} supporters</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Supporter</button>
      </div>

      {lapsing.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <AlertCircle size={20} color="#c2410c" />
          <div>
            <div style={{ fontWeight: 600, color: '#c2410c', fontSize: 14 }}>{lapsing.length} recurring donor{lapsing.length > 1 ? 's' : ''} may be lapsing</div>
            <div style={{ fontSize: 13, color: '#7c2d12' }}>No donation recorded in the past 60+ days.</div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: '100%', padding: '8px 8px 8px 36px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
            <option value="">All Types</option>
            {['individual', 'corporate', 'church', 'foundation'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="loading-center"><div className="spinner" /></div>
          : filtered.length === 0 ? <div className="empty-state"><Heart size={40} /><h3>No supporters found</h3></div>
          : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Type</th><th>Location</th><th>Total Given</th><th>Donations</th><th>Last Donation</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: { id: number; name: string; email: string; type: string; city: string; country: string; totalDonations: number; donationCount: number; lastDonationDate: string; status: string; isRecurring: boolean; lapsing: boolean }) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
                      </td>
                      <td><span className={TYPE_BADGE[s.type] || 'badge badge-gray'}>{s.type}</span></td>
                      <td style={{ fontSize: 13 }}>{s.city ? `${s.city}, ` : ''}{s.country}</td>
                      <td style={{ fontWeight: 600, color: 'var(--sage)' }}>{formatIDR(s.totalDonations || 0)}</td>
                      <td>{s.donationCount}</td>
                      <td style={{ fontSize: 13, color: s.lapsing ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {s.lastDonationDate?.slice(0, 10) || 'Never'}
                        {s.lapsing && ' ⚠'}
                      </td>
                      <td><span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span></td>
                      <td><Link to={`/admin/donors/${s.id}`} style={{ color: 'var(--terracotta)', fontSize: 13, fontWeight: 500 }}>View →</Link></td>
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
            <div className="modal-header"><h2>Add Supporter</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="form-group"><label>Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {['individual', 'corporate', 'church', 'foundation', 'government'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>City</label><input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div className="form-group"><label>Country</label><input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
              <div className="form-group"><label>Recurring?</label>
                <select value={form.isRecurring} onChange={e => setForm(p => ({ ...p, isRecurring: e.target.value }))}>
                  <option value="false">No</option><option value="true">Yes</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => create.mutate()} disabled={!form.name || create.isPending}>{create.isPending ? 'Saving...' : 'Add Supporter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
