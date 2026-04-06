import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getResidents, getSafehouses, createResident } from '../../lib/api'
import { Plus, Search, Users } from 'lucide-react'

const RISK_BADGE: Record<string, string> = {
  Critical: 'badge badge-red', High: 'badge badge-orange',
  Medium: 'badge badge-yellow', Low: 'badge badge-green'
}
const STATUS_BADGE: Record<string, string> = {
  Active: 'badge badge-blue', Closed: 'badge badge-gray',
  Transferred: 'badge badge-purple'
}

type ResidentRow = {
  residentId: number; caseControlNo: string; internalCode: string;
  caseStatus: string; currentRiskLevel: string; caseCategory: string;
  presentAge: string; reintegrationStatus: string;
  safehouses?: { name: string; city: string }
}

type SafehouseRow = { safehouseId: number; name: string; city: string }

interface ResidentForm {
  caseControlNo: string; safehouseId: string; dateOfBirth: string;
  caseStatus: string; currentRiskLevel: string; caseCategory: string;
  referralSource: string; assignedSocialWorker: string; dateOfAdmission: string;
  subCatTrafficked: boolean; subCatSexualAbuse: boolean; subCatPhysicalAbuse: boolean;
  subCatOsaec: boolean;
}

const emptyForm: ResidentForm = {
  caseControlNo: '', safehouseId: '', dateOfBirth: '', caseStatus: 'Active',
  currentRiskLevel: 'Medium', caseCategory: 'Neglected',
  referralSource: 'Government Agency', assignedSocialWorker: '', dateOfAdmission: '',
  subCatTrafficked: false, subCatSexualAbuse: false, subCatPhysicalAbuse: false, subCatOsaec: false
}

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
    mutationFn: () => createResident({
      caseControlNo: form.caseControlNo,
      safehouseId: form.safehouseId ? +form.safehouseId : null,
      dateOfBirth: form.dateOfBirth || null,
      caseStatus: form.caseStatus,
      currentRiskLevel: form.currentRiskLevel,
      initialRiskLevel: form.currentRiskLevel,
      caseCategory: form.caseCategory,
      referralSource: form.referralSource,
      assignedSocialWorker: form.assignedSocialWorker,
      dateOfAdmission: form.dateOfAdmission || null,
      subCatTrafficked: form.subCatTrafficked,
      subCatSexualAbuse: form.subCatSexualAbuse,
      subCatPhysicalAbuse: form.subCatPhysicalAbuse,
      subCatOsaec: form.subCatOsaec,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['residents'] }); setShowModal(false); setForm(emptyForm) }
  })

  const filtered = (residents ?? []).filter((r: ResidentRow) =>
    !filters.search ||
    r.caseControlNo?.toLowerCase().includes(filters.search.toLowerCase()) ||
    r.internalCode?.toLowerCase().includes(filters.search.toLowerCase())
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
              placeholder="Search case no. or code..." value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              style={{ paddingLeft: 36, width: '100%', padding: '8px 8px 8px 36px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <select value={filters.safehouseId} onChange={e => setFilters(p => ({ ...p, safehouseId: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
            <option value="">All Safehouses</option>
            {(safehouses ?? []).map((s: SafehouseRow) => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
            <option value="">All Status</option>
            {['Active', 'Closed', 'Transferred'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.riskLevel} onChange={e => setFilters(p => ({ ...p, riskLevel: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
            <option value="">All Risk Levels</option>
            {['Low', 'Medium', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
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
                    <th>Case No.</th><th>Age</th><th>Safehouse</th><th>Category</th>
                    <th>Status</th><th>Risk Level</th><th>Reintegration</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: ResidentRow) => (
                    <tr key={r.residentId}>
                      <td>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{r.caseControlNo || '—'}</div>
                        {r.internalCode && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.internalCode}</div>}
                      </td>
                      <td style={{ fontSize: 13 }}>{r.presentAge || '—'}</td>
                      <td style={{ fontSize: 13 }}>{r.safehouses?.name || '—'}</td>
                      <td style={{ fontSize: 13 }}>{r.caseCategory || '—'}</td>
                      <td><span className={STATUS_BADGE[r.caseStatus] || 'badge badge-gray'}>{r.caseStatus}</span></td>
                      <td><span className={RISK_BADGE[r.currentRiskLevel] || 'badge badge-gray'}>{r.currentRiskLevel}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.reintegrationStatus || 'Not Started'}</td>
                      <td><Link to={`/admin/residents/${r.residentId}`} style={{ color: 'var(--terracotta)', fontSize: 13, fontWeight: 500 }}>View →</Link></td>
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
              <div className="form-group"><label>Case Control No. *</label><input value={form.caseControlNo} onChange={e => setForm(p => ({ ...p, caseControlNo: e.target.value }))} placeholder="C0001" /></div>
              <div className="form-group"><label>Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} /></div>
              <div className="form-group"><label>Safehouse</label>
                <select value={form.safehouseId} onChange={e => setForm(p => ({ ...p, safehouseId: e.target.value }))}>
                  <option value="">Select safehouse</option>
                  {(safehouses ?? []).map((s: SafehouseRow) => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Admission Date</label><input type="date" value={form.dateOfAdmission} onChange={e => setForm(p => ({ ...p, dateOfAdmission: e.target.value }))} /></div>
              <div className="form-group"><label>Case Category</label>
                <select value={form.caseCategory} onChange={e => setForm(p => ({ ...p, caseCategory: e.target.value }))}>
                  {['Abandoned', 'Foundling', 'Surrendered', 'Neglected'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Risk Level</label>
                <select value={form.currentRiskLevel} onChange={e => setForm(p => ({ ...p, currentRiskLevel: e.target.value }))}>
                  {['Low', 'Medium', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Case Status</label>
                <select value={form.caseStatus} onChange={e => setForm(p => ({ ...p, caseStatus: e.target.value }))}>
                  {['Active', 'Closed', 'Transferred'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Referral Source</label>
                <select value={form.referralSource} onChange={e => setForm(p => ({ ...p, referralSource: e.target.value }))}>
                  {['Government Agency', 'NGO', 'Police', 'Self-Referral', 'Community', 'Court Order'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Assigned Social Worker</label><input value={form.assignedSocialWorker} onChange={e => setForm(p => ({ ...p, assignedSocialWorker: e.target.value }))} /></div>
            </div>
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>Sub-categories</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  ['subCatTrafficked', 'Trafficked'],
                  ['subCatSexualAbuse', 'Sexual Abuse'],
                  ['subCatPhysicalAbuse', 'Physical Abuse'],
                  ['subCatOsaec', 'OSAEC/CSAEM']
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[key as keyof ResidentForm] as boolean}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => create.mutate()} disabled={!form.caseControlNo || create.isPending}>
                {create.isPending ? 'Saving...' : 'Add Resident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
