import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPartners, createPartner, updatePartner } from '../../lib/api'
import { Plus, Handshake } from 'lucide-react'

const ROLE_BADGE: Record<string, string> = {
  LegalSupport: 'badge badge-orange', Medical: 'badge badge-blue',
  Education: 'badge badge-green', Psychosocial: 'badge badge-purple',
  FundingDonor: 'badge badge-yellow', Training: 'badge badge-gray',
  Advocacy: 'badge badge-red'
}

type PartnerRow = {
  partnerId: number; partnerName: string; partnerType: string; roleType: string;
  contactName: string; email: string; phone: string; region: string;
  status: string; startDate: string; notes: string
}

export default function Partners() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    partnerName: '', partnerType: 'NGO', roleType: 'LegalSupport',
    contactName: '', email: '', phone: '',
    region: 'Luzon', status: 'Active', startDate: '', notes: ''
  })

  const { data: partners, isLoading } = useQuery({ queryKey: ['partners'], queryFn: getPartners })

  const create = useMutation({
    mutationFn: () => createPartner(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setShowModal(false); resetForm() }
  })
  const update = useMutation({
    mutationFn: () => updatePartner(editId!, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setShowModal(false); resetForm() }
  })

  function resetForm() {
    setForm({ partnerName: '', partnerType: 'NGO', roleType: 'LegalSupport', contactName: '', email: '', phone: '', region: 'Luzon', status: 'Active', startDate: '', notes: '' })
    setEditId(null)
  }

  function openEdit(p: PartnerRow) {
    setEditId(p.partnerId)
    setForm({
      partnerName: p.partnerName, partnerType: p.partnerType || 'NGO', roleType: p.roleType || 'LegalSupport',
      contactName: p.contactName || '', email: p.email || '', phone: p.phone || '',
      region: p.region || 'Luzon', status: p.status || 'Active', startDate: p.startDate || '', notes: p.notes || ''
    })
    setShowModal(true)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Partner Organizations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{(partners ?? []).length} partners</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}><Plus size={16} /> Add Partner</button>
      </div>

      {isLoading ? <div className="loading-center"><div className="spinner" /></div>
        : (partners ?? []).length === 0 ? <div className="empty-state"><Handshake size={40} /><h3>No partners yet</h3></div>
        : (
          <div className="grid-2">
            {(partners ?? []).map((p: PartnerRow) => (
              <div key={p.partnerId} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.partnerName}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-gray">{p.partnerType}</span>
                      <span className={ROLE_BADGE[p.roleType] || 'badge badge-gray'}>{p.roleType}</span>
                      <span className={`badge ${p.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{p.status}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{p.region} · Philippines</div>
                {p.contactName && (
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    {p.contactName}
                    {p.email && <> · <a href={`mailto:${p.email}`} style={{ color: 'var(--terracotta)' }}>{p.email}</a></>}
                  </div>
                )}
                {p.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>{p.notes}</p>}
              </div>
            ))}
          </div>
        )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit Partner' : 'Add Partner'}</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Partner Name *</label><input value={form.partnerName} onChange={e => setForm(p => ({ ...p, partnerName: e.target.value }))} /></div>
              <div className="form-group"><label>Organization Type</label>
                <select value={form.partnerType} onChange={e => setForm(p => ({ ...p, partnerType: e.target.value }))}>
                  {['NGO', 'Government', 'International', 'LawEnforcement', 'Church', 'Academic', 'Corporate'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Role Type</label>
                <select value={form.roleType} onChange={e => setForm(p => ({ ...p, roleType: e.target.value }))}>
                  {['LegalSupport', 'Medical', 'Education', 'Psychosocial', 'FundingDonor', 'Training', 'Advocacy', 'Housing', 'ReintegrationSupport'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Region</label>
                <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}>
                  {['Luzon', 'Visayas', 'Mindanao', 'National', 'International'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Contact Person</label><input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="form-group"><label>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="Active">Active</option><option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => editId ? update.mutate() : create.mutate()} disabled={!form.partnerName}>
                {editId ? 'Save Changes' : 'Add Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
