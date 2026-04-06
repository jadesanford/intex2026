import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getSupporters, createSupporter } from '../../lib/api'
import { Plus, Heart, Search } from 'lucide-react'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

const TYPE_BADGE: Record<string, string> = {
  MonetaryDonor: 'badge badge-green',
  InKindDonor: 'badge badge-blue',
  Volunteer: 'badge badge-purple',
  SkillsContributor: 'badge badge-orange',
  SocialMediaAdvocate: 'badge badge-yellow',
  PartnerOrganization: 'badge badge-gray'
}

type SupporterRow = {
  supporterId: number; supporterType: string; displayName: string; organizationName: string;
  firstName: string; lastName: string; relationshipType: string; country: string; region: string;
  email: string; phone: string; status: string; firstDonationDate: string;
  acquisitionChannel: string; totalMonetary: number; donationCount: number; lastDonationDate: string
}

export default function Donors() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    supporterType: 'MonetaryDonor', displayName: '', organizationName: '',
    firstName: '', lastName: '', relationshipType: 'Local',
    country: 'Philippines', region: '', email: '', phone: '',
    status: 'Active', acquisitionChannel: 'Website'
  })

  const { data: supporters, isLoading } = useQuery({
    queryKey: ['supporters', typeFilter],
    queryFn: () => getSupporters(typeFilter ? { type: typeFilter } : undefined)
  })

  const create = useMutation({
    mutationFn: () => createSupporter(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['supporters'] }); setShowModal(false) }
  })

  const filtered = (supporters ?? []).filter((s: SupporterRow) => {
    const name = s.displayName || s.organizationName || `${s.firstName} ${s.lastName}`
    return !search || name.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Donors & Supporters</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{filtered.length} supporters</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Supporter</button>
      </div>

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
            {['MonetaryDonor', 'InKindDonor', 'Volunteer', 'SkillsContributor', 'SocialMediaAdvocate', 'PartnerOrganization']
              .map(t => <option key={t} value={t}>{t}</option>)}
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
                    <th>Name</th><th>Type</th><th>Relationship</th><th>Total Given</th>
                    <th>Donations</th><th>Last Donation</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: SupporterRow) => {
                    const name = s.displayName || s.organizationName || `${s.firstName || ''} ${s.lastName || ''}`.trim()
                    return (
                      <tr key={s.supporterId}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email || s.country}</div>
                        </td>
                        <td><span className={TYPE_BADGE[s.supporterType] || 'badge badge-gray'}>{s.supporterType}</span></td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.relationshipType}</td>
                        <td style={{ fontWeight: 600, color: 'var(--sage)' }}>{formatPHP(s.totalMonetary || 0)}</td>
                        <td style={{ fontSize: 13 }}>{s.donationCount}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.lastDonationDate?.slice(0, 10) || 'Never'}</td>
                        <td><span className={`badge ${s.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span></td>
                        <td><Link to={`/admin/donors/${s.supporterId}`} style={{ color: 'var(--terracotta)', fontSize: 13, fontWeight: 500 }}>View →</Link></td>
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
            <div className="modal-header"><h2>Add Supporter</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="grid-2">
              <div className="form-group"><label>Type</label>
                <select value={form.supporterType} onChange={e => setForm(p => ({ ...p, supporterType: e.target.value }))}>
                  {['MonetaryDonor', 'InKindDonor', 'Volunteer', 'SkillsContributor', 'SocialMediaAdvocate', 'PartnerOrganization']
                    .map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Display Name *</label><input value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} /></div>
              <div className="form-group"><label>First Name</label><input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} /></div>
              <div className="form-group"><label>Last Name</label><input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></div>
              <div className="form-group"><label>Organization Name</label><input value={form.organizationName} onChange={e => setForm(p => ({ ...p, organizationName: e.target.value }))} /></div>
              <div className="form-group"><label>Relationship</label>
                <select value={form.relationshipType} onChange={e => setForm(p => ({ ...p, relationshipType: e.target.value }))}>
                  {['Local', 'International', 'PartnerOrganization'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="form-group"><label>Country</label><input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
              <div className="form-group"><label>Acquisition Channel</label>
                <select value={form.acquisitionChannel} onChange={e => setForm(p => ({ ...p, acquisitionChannel: e.target.value }))}>
                  {['Website', 'SocialMedia', 'Event', 'WordOfMouth', 'PartnerReferral', 'Church'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => create.mutate()} disabled={!form.displayName || create.isPending}>
                {create.isPending ? 'Saving...' : 'Add Supporter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
