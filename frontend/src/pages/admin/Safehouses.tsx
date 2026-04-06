import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSafehouses, createSafehouse, updateSafehouse } from '../../lib/api'
import { Plus, Building2, MapPin } from 'lucide-react'

type SafehouseType = {
  safehouseId: number; safehouseCode?: string; name: string; region: string; city: string;
  province: string; capacityGirls: number; capacityStaff: number; currentOccupancy: number;
  status: string; openDate: string; notes: string
}

export default function Safehouses() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', safehouseCode: '', region: 'Luzon', city: '', province: '',
    capacityGirls: '', capacityStaff: '', currentOccupancy: '0',
    status: 'Active', openDate: '', notes: ''
  })

  const { data: safehouses, isLoading } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })

  const create = useMutation({
    mutationFn: () => createSafehouse({
      name: form.name, safehouseCode: form.safehouseCode, region: form.region,
      city: form.city, province: form.province,
      capacityGirls: form.capacityGirls ? +form.capacityGirls : null,
      capacityStaff: form.capacityStaff ? +form.capacityStaff : null,
      currentOccupancy: form.currentOccupancy ? +form.currentOccupancy : 0,
      status: form.status, openDate: form.openDate || null, notes: form.notes
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safehouses'] }); setShowModal(false); resetForm() }
  })

  const update = useMutation({
    mutationFn: () => updateSafehouse(editId!, {
      name: form.name, safehouseCode: form.safehouseCode, region: form.region,
      city: form.city, province: form.province,
      capacityGirls: form.capacityGirls ? +form.capacityGirls : null,
      capacityStaff: form.capacityStaff ? +form.capacityStaff : null,
      currentOccupancy: form.currentOccupancy ? +form.currentOccupancy : 0,
      status: form.status, openDate: form.openDate || null, notes: form.notes
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safehouses'] }); setShowModal(false); setEditId(null); resetForm() }
  })

  function resetForm() {
    setForm({ name: '', safehouseCode: '', region: 'Luzon', city: '', province: '', capacityGirls: '', capacityStaff: '', currentOccupancy: '0', status: 'Active', openDate: '', notes: '' })
  }

  function openEdit(s: SafehouseType) {
    setEditId(s.safehouseId)
    setForm({
      name: s.name, safehouseCode: s.safehouseCode || '', region: s.region || 'Luzon',
      city: s.city || '', province: s.province || '',
      capacityGirls: String(s.capacityGirls || ''),
      capacityStaff: String(s.capacityStaff || ''),
      currentOccupancy: String(s.currentOccupancy || 0),
      status: s.status || 'Active', openDate: s.openDate || '', notes: s.notes || ''
    })
    setShowModal(true)
  }

  const totalCapacity = (safehouses ?? []).reduce((sum: number, s: SafehouseType) => sum + (s.capacityGirls || 0), 0)
  const totalOccupied = (safehouses ?? []).reduce((sum: number, s: SafehouseType) => sum + (s.currentOccupancy || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Safehouses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {totalOccupied} / {totalCapacity} girls across {(safehouses ?? []).length} locations
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditId(null); setShowModal(true) }}>
          <Plus size={16} /> Add Safehouse
        </button>
      </div>

      {isLoading ? <div className="loading-center"><div className="spinner" /></div>
        : (
          <div className="grid-3">
            {(safehouses ?? []).map((s: SafehouseType) => {
              const occupancy = s.capacityGirls > 0 ? Math.round((s.currentOccupancy / s.capacityGirls) * 100) : 0
              return (
                <div key={s.safehouseId} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.name}</div>
                      {s.safehouseCode && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 4 }}>{s.safehouseCode}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                        <MapPin size={12} /> {s.city}{s.province ? `, ${s.province}` : ''}
                      </div>
                    </div>
                    <span className={`badge ${s.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--terracotta)' }}>{s.currentOccupancy ?? 0}</div>
                      <div style={{ color: 'var(--text-muted)' }}>in care</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--navy)' }}>{s.capacityGirls ?? 0}</div>
                      <div style={{ color: 'var(--text-muted)' }}>capacity</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--sage)' }}>{s.capacityStaff ?? 0}</div>
                      <div style={{ color: 'var(--text-muted)' }}>staff</div>
                    </div>
                  </div>

                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{
                      height: '100%', borderRadius: 3, transition: 'width 0.5s',
                      background: occupancy > 85 ? 'var(--danger)' : occupancy > 60 ? 'var(--warning)' : 'var(--sage)',
                      width: `${Math.min(100, occupancy)}%`
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    {occupancy}% occupied · {s.region}
                  </div>

                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openEdit(s)}>
                    Edit
                  </button>
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
              <div className="form-group"><label>Code (e.g. SH-01)</label><input value={form.safehouseCode} onChange={e => setForm(p => ({ ...p, safehouseCode: e.target.value }))} placeholder="SH-01" /></div>
              <div className="form-group"><label>Region</label>
                <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}>
                  {['Luzon', 'Visayas', 'Mindanao'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group"><label>City</label><input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div className="form-group"><label>Province</label><input value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))} /></div>
              <div className="form-group"><label>Capacity (Girls)</label><input type="number" value={form.capacityGirls} onChange={e => setForm(p => ({ ...p, capacityGirls: e.target.value }))} /></div>
              <div className="form-group"><label>Capacity (Staff)</label><input type="number" value={form.capacityStaff} onChange={e => setForm(p => ({ ...p, capacityStaff: e.target.value }))} /></div>
              <div className="form-group"><label>Current Occupancy</label><input type="number" value={form.currentOccupancy} onChange={e => setForm(p => ({ ...p, currentOccupancy: e.target.value }))} /></div>
              <div className="form-group"><label>Open Date</label><input type="date" value={form.openDate} onChange={e => setForm(p => ({ ...p, openDate: e.target.value }))} /></div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {['Active', 'Inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => editId ? update.mutate() : create.mutate()}
                disabled={!form.name || create.isPending || update.isPending}>
                {(create.isPending || update.isPending) ? 'Saving...' : editId ? 'Save Changes' : 'Add Safehouse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
