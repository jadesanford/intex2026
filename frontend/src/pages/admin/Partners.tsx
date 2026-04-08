import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPartners, createPartner, updatePartner, deletePartner } from '../../lib/api'
import { Plus, Handshake, AlertTriangle } from 'lucide-react'

const ROLE_BADGE: Record<string, string> = {
  SafehouseOps: 'badge badge-orange',
  Evaluation: 'badge badge-blue',
  Education: 'badge badge-green',
  Logistics: 'badge badge-purple',
  Maintenance: 'badge badge-yellow',
  FindSafehouse: 'badge badge-gray'
}

const PARTNER_TYPE_OPTIONS = ['Organization', 'Individual'] as const
const ROLE_TYPE_OPTIONS = ['SafehouseOps', 'Evaluation', 'Education', 'Logistics', 'Maintenance', 'FindSafehouse'] as const

function apiErrorMessage(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: { message?: string; detail?: string; title?: string } } })?.response?.data
  if (!d) return fallback
  return d.message || d.detail || d.title || fallback
}

type PartnerRow = {
  partnerId: number; partnerName: string; partnerType: string; roleType: string;
  contactName: string; email: string; phone: string; region: string;
  status: string; startDate: string; endDate?: string; notes: string
}

export default function Partners() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PartnerRow | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    partnerName: '', partnerType: 'Organization', roleType: 'SafehouseOps',
    contactName: '', email: '', phone: '',
    region: 'Luzon', status: 'Active', startDate: '', endDate: '', notes: ''
  })

  const { data: partners, isLoading } = useQuery({ queryKey: ['partners'], queryFn: getPartners })

  const create = useMutation({
    mutationFn: () => createPartner({
      ...form,
      startDate: form.startDate || null,
      endDate: form.endDate || null
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setShowModal(false); resetForm() },
    onError: (err: unknown) => window.alert(apiErrorMessage(err, 'Unable to create partner.'))
  })
  const update = useMutation({
    mutationFn: () => updatePartner(editId!, {
      ...form,
      startDate: form.startDate || null,
      endDate: form.endDate || null
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setShowModal(false); resetForm() },
    onError: (err: unknown) => window.alert(apiErrorMessage(err, 'Unable to update partner.'))
  })
  const remove = useMutation({
    mutationFn: (id: number) => deletePartner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
      setDeleteTarget(null)
      setDeleteError('')
    },
    onError: (err: unknown) => setDeleteError(apiErrorMessage(err, 'Unable to delete partner.'))
  })

  function resetForm() {
    setForm({
      partnerName: '',
      partnerType: 'Organization',
      roleType: 'SafehouseOps',
      contactName: '',
      email: '',
      phone: '',
      region: 'Luzon',
      status: 'Active',
      startDate: '',
      endDate: '',
      notes: ''
    })
    setEditId(null)
  }

  function openEdit(p: PartnerRow) {
    setEditId(p.partnerId)
    setForm({
      partnerName: p.partnerName, partnerType: p.partnerType || 'Organization', roleType: p.roleType || 'SafehouseOps',
      contactName: p.contactName || '', email: p.email || '', phone: p.phone || '',
      region: p.region || 'Luzon', status: p.status || 'Active', startDate: p.startDate || '', endDate: p.endDate || '', notes: p.notes || ''
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
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={remove.isPending}
                      onClick={() => {
                        setDeleteError('')
                        setDeleteTarget(p)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{p.region} · Philippines</div>
                {p.contactName && (
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    {p.contactName}
                    {p.email && <> · <a href={`mailto:${p.email}`} style={{ color: 'var(--terracotta)' }}>{p.email}</a></>}
                  </div>
                )}
                {p.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>{p.notes}</p>}
                <div style={{ marginTop: 10 }}>
                  <Link to={`/admin/partners/${p.partnerId}`} style={{ color: 'var(--terracotta)', fontSize: 13, fontWeight: 500 }}>
                    View details →
                  </Link>
                </div>
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
                  {PARTNER_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Role Type</label>
                <select value={form.roleType} onChange={e => setForm(p => ({ ...p, roleType: e.target.value }))}>
                  {ROLE_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
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
              <div className="form-group"><label>End Date</label><input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
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

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => { setDeleteTarget(null); setDeleteError('') }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#fee2e2', color: '#b91c1c' }}>
                <AlertTriangle size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Delete partner</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This will permanently remove <strong>{deleteTarget.partnerName}</strong> and its partner assignments. This action cannot be undone.
            </p>
            {deleteError && <p style={{ margin: '12px 0 0', color: '#b91c1c', fontSize: 13 }}>{deleteError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setDeleteTarget(null); setDeleteError('') }}>Cancel</button>
              <button type="button" className="btn btn-danger" disabled={remove.isPending} onClick={() => remove.mutate(deleteTarget.partnerId)}>
                {remove.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
