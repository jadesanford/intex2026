import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getResidents, getSafehouses, createResident } from '../../lib/api'
import { Plus, Search, Filter, Users } from 'lucide-react'

const RISK_BADGE: Record<string, string> = {
  critical: 'badge badge-red', high: 'badge badge-orange',
  medium: 'badge badge-yellow', low: 'badge badge-green'
}
const STATUS_BADGE: Record<string, string> = {
  active: 'badge badge-blue', reintegrated: 'badge badge-green',
  transferred: 'badge badge-purple', discharged: 'badge badge-gray'
}

interface ResidentForm { caseCode: string; safehouseId: string; age: string; admissionDate: string; status: string; riskLevel: string; caseCategory: string; referralSource: string; notes: string }
const emptyForm: ResidentForm = { caseCode: '', safehouseId: '', age: '', admissionDate: '', status: 'active', riskLevel: 'medium', caseCategory: 'trafficking', referralSource: '', notes: '' }

export default function Residents() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ safehouseId: '', status: '', riskLevel: '', search: '' })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ResidentForm>(emptyForm)

  const { data: residents, isLoading } = useQuery({
    queryKey: ['residents', filters],
    queryFn: () => getResidents({
      ...(filters.safehouseId && { safehouseId: filters.safehouseId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
    })
  })

  const { data: safehouses } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })

  const create = useMutation({
    mutationFn: () => createResident({ ...form, safehouseId: form.safehouseId ? +form.safehouseId : null, age: form.age ? +form.age : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['residents'] }); setShowModal(false); setForm(emptyForm) }
  })

  const filtered = (residents ?? []).filter((r: { caseCode: string }) =>
    !filters.search || r.caseCode.toLowerCase().includes(filters.search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Caseload Inventory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{filtered.length} residents</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Resident</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              placeholder="Search case code..." value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              style={{ paddingLeft: 36, width: '100%', padding: '8px 8px 8px 36px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <select value={filters.safehouseId} onChange={e => setFilters(p => ({ ...p, safehouseId: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
            <option value="">All Safehouses</option>
            {(safehouses ?? []).map((s: { id: number; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
            <option value="">All Status</option>
            {['active', 'reintegrated', 'transferred', 'discharged'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.riskLevel} onChange={e => setFilters(p => ({ ...p, riskLevel: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
            <option value="">All Risk Levels</option>
            {['low', 'medium', 'high', 'critical'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="loading-center"><div className="spinner" /></div>
          : filtered.length === 0 ? <div className="empty-state"><Users size={40} /><h3>No residents found</h3><p>Try adjusting your filters or add a new resident.</p></div>
          : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Case Code</th><th>Age</th><th>Safehouse</th><th>Category</th><th>Status</th><th>Risk Level</th><th>Progress</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: { id: number; caseCode: string; age: number; status: string; riskLevel: string; caseCategory: string; reintegrationProgress: number; safehouses?: { name: string } }) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{r.caseCode}</td>
                      <td>{r.age ?? '—'}</td>
                      <td>{r.safehouses?.name || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{r.caseCategory?.replace('_', ' ') || '—'}</td>
                      <td><span className={STATUS_BADGE[r.status] || 'badge badge-gray'}>{r.status}</span></td>
                      <td><span className={RISK_BADGE[r.riskLevel] || 'badge badge-gray'}>{r.riskLevel}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                            <div style={{ height: '100%', background: 'var(--sage)', borderRadius: 3, width: `${r.reintegrationProgress || 0}%` }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>{r.reintegrationProgress || 0}%</span>
                        </div>
                      </td>
                      <td><Link to={`/admin/residents/${r.id}`} style={{ color: 'var(--terracotta)', fontSize: 13, fontWeight: 500 }}>View →</Link></td>
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
            <div className="modal-header">
              <h2>Add New Resident</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Case Code *</label><input value={form.caseCode} onChange={e => setForm(p => ({ ...p, caseCode: e.target.value }))} placeholder="OA-2024-XXX" /></div>
              <div className="form-group"><label>Age</label><input type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} /></div>
              <div className="form-group"><label>Safehouse</label>
                <select value={form.safehouseId} onChange={e => setForm(p => ({ ...p, safehouseId: e.target.value }))}>
                  <option value="">Select safehouse</option>
                  {(safehouses ?? []).map((s: { id: number; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Admission Date</label><input type="date" value={form.admissionDate} onChange={e => setForm(p => ({ ...p, admissionDate: e.target.value }))} /></div>
              <div className="form-group"><label>Case Category</label>
                <select value={form.caseCategory} onChange={e => setForm(p => ({ ...p, caseCategory: e.target.value }))}>
                  {['trafficking', 'sexual_abuse', 'physical_abuse', 'neglect', 'other'].map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Risk Level</label>
                <select value={form.riskLevel} onChange={e => setForm(p => ({ ...p, riskLevel: e.target.value }))}>
                  {['low', 'medium', 'high', 'critical'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {['active', 'reintegrated', 'transferred', 'discharged'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Referral Source</label>
                <select value={form.referralSource} onChange={e => setForm(p => ({ ...p, referralSource: e.target.value }))}>
                  <option value="">Select</option>
                  {['police_referral', 'hospital_referral', 'ngo_partner', 'community_referral', 'school_referral', 'self_referral'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label>Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => create.mutate()} disabled={!form.caseCode || create.isPending}>
                {create.isPending ? 'Saving...' : 'Add Resident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
