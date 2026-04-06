import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPartners, createPartner, updatePartner } from '../../lib/api'
import { Plus, Handshake } from 'lucide-react'

const TYPE_BADGE: Record<string, string> = {
  ngo: 'badge badge-green', government: 'badge badge-blue',
  international: 'badge badge-purple', law_enforcement: 'badge badge-orange', church: 'badge badge-yellow'
}

export default function Partners() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', type: 'ngo', country: 'Indonesia', contactPerson: '', contactEmail: '', website: '', activeStatus: 'true', notes: '' })

  const { data: partners, isLoading } = useQuery({ queryKey: ['partners'], queryFn: getPartners })

  const create = useMutation({
    mutationFn: () => createPartner({ ...form, activeStatus: form.activeStatus === 'true' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setShowModal(false); resetForm() }
  })
  const update = useMutation({
    mutationFn: () => updatePartner(editId!, { ...form, activeStatus: form.activeStatus === 'true' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setShowModal(false); resetForm() }
  })

  function resetForm() { setForm({ name: '', type: 'ngo', country: 'Indonesia', contactPerson: '', contactEmail: '', website: '', activeStatus: 'true', notes: '' }); setEditId(null) }

  function openEdit(p: Record<string, unknown>) {
    setEditId(p.id as number)
    setForm({ name: p.name as string, type: p.type as string, country: p.country as string, contactPerson: p.contactPerson as string || '', contactEmail: p.contactEmail as string || '', website: p.website as string || '', activeStatus: String(p.activeStatus ?? true), notes: p.notes as string || '' })
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
            {(partners ?? []).map((p: { id: number; name: string; type: string; country: string; contactPerson: string; contactEmail: string; website: string; activeStatus: boolean; notes: string }) => (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className={TYPE_BADGE[p.type] || 'badge badge-gray'}>{p.type?.replace('_', ' ')}</span>
                      <span className={`badge ${p.activeStatus ? 'badge-green' : 'badge-gray'}`}>{p.activeStatus ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p as unknown as Record<string, unknown>)}>Edit</button>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{p.country}</div>
                {p.contactPerson && <div style={{ fontSize: 13, marginTop: 6 }}>{p.contactPerson} · <a href={`mailto:${p.contactEmail}`} style={{ color: 'var(--terracotta)' }}>{p.contactEmail}</a></div>}
                {p.website && <a href={`https://${p.website}`} target="_blank" rel="noopener" style={{ fontSize: 12, color: 'var(--info)', marginTop: 4, display: 'block' }}>{p.website}</a>}
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
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label>Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {['ngo', 'government', 'international', 'law_enforcement', 'church', 'academic', 'corporate'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Country</label><input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
              <div className="form-group"><label>Contact Person</label><input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} /></div>
              <div className="form-group"><label>Contact Email</label><input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} /></div>
              <div className="form-group"><label>Website</label><input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="e.g. www.partner.org" /></div>
              <div className="form-group"><label>Status</label>
                <select value={form.activeStatus} onChange={e => setForm(p => ({ ...p, activeStatus: e.target.value }))}>
                  <option value="true">Active</option><option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => editId ? update.mutate() : create.mutate()} disabled={!form.name}>{editId ? 'Save Changes' : 'Add Partner'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
