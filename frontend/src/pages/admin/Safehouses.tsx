import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSafehouses, createSafehouse, updateSafehouse } from '../../lib/api'
import { Plus, Building2, MapPin } from 'lucide-react'

export default function Safehouses() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', region: '', city: '', capacity: '', status: 'active', latitude: '', longitude: '', contactPerson: '', contactPhone: '' })

  const { data: safehouses, isLoading } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })

  const create = useMutation({
    mutationFn: () => createSafehouse({ ...form, capacity: form.capacity ? +form.capacity : null, latitude: form.latitude ? +form.latitude : null, longitude: form.longitude ? +form.longitude : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safehouses'] }); setShowModal(false); resetForm() }
  })
  const update = useMutation({
    mutationFn: () => updateSafehouse(editId!, { ...form, capacity: form.capacity ? +form.capacity : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safehouses'] }); setShowModal(false); setEditId(null); resetForm() }
  })

  function resetForm() { setForm({ name: '', region: '', city: '', capacity: '', status: 'active', latitude: '', longitude: '', contactPerson: '', contactPhone: '' }) }

  function openEdit(s: Record<string, unknown>) {
    setEditId(s.id as number)
    setForm({ name: s.name as string, region: s.region as string || '', city: s.city as string || '', capacity: String(s.capacity || ''), status: s.status as string || 'active', latitude: String(s.latitude || ''), longitude: String(s.longitude || ''), contactPerson: s.contactPerson as string || '', contactPhone: s.contactPhone as string || '' })
    setShowModal(true)
  }

  const total = (safehouses ?? []).reduce((sum: number, s: { capacity: number }) => sum + (s.capacity || 0), 0)
  const totalOccupied = (safehouses ?? []).reduce((sum: number, s: { currentResidents: number }) => sum + (s.currentResidents || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Safehouses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {totalOccupied} / {total} capacity used across {(safehouses ?? []).length} locations
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditId(null); setShowModal(true) }}><Plus size={16} /> Add Safehouse</button>
      </div>

      {isLoading ? <div className="loading-center"><div className="spinner" /></div>
        : (
          <div className="grid-3">
            {(safehouses ?? []).map((s: { id: number; name: string; region: string; city: string; capacity: number; status: string; currentResidents: number; totalResidents: number; contactPerson: string; contactPhone: string; latitude: number; longitude: number }) => {
              const occupancy = s.capacity > 0 ? Math.round((s.currentResidents / s.capacity) * 100) : 0
              return (
                <div key={s.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                        <MapPin size={12} /> {s.city}, {s.region}
                      </div>
                    </div>
                    <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--terracotta)' }}>{s.currentResidents}</div>
                      <div style={{ color: 'var(--text-muted)' }}>in care</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--navy)' }}>{s.capacity}</div>
                      <div style={{ color: 'var(--text-muted)' }}>capacity</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--sage)' }}>{s.totalResidents}</div>
                      <div style={{ color: 'var(--text-muted)' }}>total</div>
                    </div>
                  </div>

                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{
                      height: '100%', borderRadius: 3, transition: 'width 0.5s',
                      background: occupancy > 85 ? 'var(--danger)' : occupancy > 60 ? 'var(--warning)' : 'var(--sage)',
                      width: `${Math.min(100, occupancy)}%`
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{occupancy}% occupied</div>

                  {s.contactPerson && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      {s.contactPerson} · {s.contactPhone}
                    </div>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} onClick={() => openEdit(s as unknown as Record<string, unknown>)}>Edit</button>
                </div>
              )
            })}
          </div>
        )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Safehouse' : 'Add Safehouse'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label>Region/Province</label><input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} /></div>
              <div className="form-group"><label>City</label><input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div className="form-group"><label>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} /></div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {['active', 'inactive', 'under_renovation'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Latitude</label><input type="number" step="0.0001" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} /></div>
              <div className="form-group"><label>Longitude</label><input type="number" step="0.0001" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} /></div>
              <div className="form-group"><label>Contact Person</label><input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} /></div>
              <div className="form-group"><label>Contact Phone</label><input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => editId ? update.mutate() : create.mutate()} disabled={!form.name || create.isPending || update.isPending}>
                {(create.isPending || update.isPending) ? 'Saving...' : editId ? 'Save Changes' : 'Add Safehouse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
