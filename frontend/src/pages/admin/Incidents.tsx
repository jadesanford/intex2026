import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getIncidents, createIncident, updateIncident, deleteIncident, getSafehouses, getResidents } from '../../lib/api'
import { Plus, AlertTriangle } from 'lucide-react'

const SEVERITY_BADGE: Record<string, string> = {
  Low: 'badge badge-green', Medium: 'badge badge-yellow',
  High: 'badge badge-orange', Critical: 'badge badge-red'
}

type IncidentRow = {
  residentId?: number | null; safehouseId?: number | null;
  incidentId: number; incidentDate: string; incidentType: string; severity: string;
  description: string; responseTaken: string; reportedBy: string; resolved: boolean; resolutionDate?: string;
  followUpRequired: boolean; safehouses?: { name: string }; residents?: { caseControlNo: string }
}

type SafehouseRow = { safehouseId: number; name: string }
type ResidentRow = { residentId: number; caseControlNo: string; internalCode: string }

const INCIDENT_TYPE_OPTIONS = ['Medical', 'Security', 'RunawayAttempt', 'Behavioral', 'SelfHarm', 'Other'] as const

function apiErrorMessage(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: { message?: string; detail?: string; title?: string } } })?.response?.data
  if (!d) return err instanceof Error ? err.message : fallback
  return d.message || d.detail || d.title || fallback
}

export default function Incidents() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IncidentRow | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [filter, setFilter] = useState({ resolved: '', severity: '' })
  const [form, setForm] = useState({
    residentId: '', safehouseId: '', incidentDate: new Date().toISOString().slice(0, 10),
    incidentType: 'Behavioral', severity: 'Medium', description: '', resolutionDate: '',
    responseTaken: '', reportedBy: '', resolved: 'false', followUpRequired: 'false'
  })

  const params = {
    ...(filter.severity && { severity: filter.severity }),
    ...(filter.resolved !== '' && { resolved: filter.resolved === 'true' })
  }
  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents', filter],
    queryFn: () => getIncidents(params as Record<string, string | boolean>)
  })
  const { data: safehouses } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })
  const { data: residents } = useQuery({ queryKey: ['residents'], queryFn: () => getResidents() })

  const create = useMutation({
    mutationFn: () => {
      if (!form.safehouseId) throw new Error('Safehouse is required.')
      if (!form.residentId) throw new Error('Resident is required.')
      if (!form.reportedBy.trim()) throw new Error('Reported by is required.')
      if (!form.incidentDate) throw new Error('Incident date is required.')
      if (!form.description.trim()) throw new Error('Description is required.')
      return createIncident({
        residentId: +form.residentId,
        safehouseId: +form.safehouseId,
        incidentDate: form.incidentDate,
        incidentType: form.incidentType,
        severity: form.severity,
        description: form.description.trim(),
        responseTaken: form.responseTaken,
        reportedBy: form.reportedBy.trim(),
        resolved: form.resolved === 'true',
        followUpRequired: form.followUpRequired === 'true',
        resolutionDate: form.resolutionDate || null
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setShowModal(false); resetForm() },
    onError: (err: unknown) => window.alert(apiErrorMessage(err, 'Unable to create incident.'))
  })

  const update = useMutation({
    mutationFn: () => updateIncident(editId!, {
      residentId: form.residentId ? +form.residentId : null,
      safehouseId: form.safehouseId ? +form.safehouseId : null,
      incidentDate: form.incidentDate,
      incidentType: form.incidentType,
      severity: form.severity,
      description: form.description,
      responseTaken: form.responseTaken,
      reportedBy: form.reportedBy,
      resolved: form.resolved === 'true',
      followUpRequired: form.followUpRequired === 'true',
      resolutionDate: form.resolutionDate || null
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setShowModal(false); resetForm() },
    onError: (err: unknown) => window.alert(apiErrorMessage(err, 'Unable to update incident.'))
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteIncident(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] })
      setDeleteTarget(null)
      setDeleteError('')
    },
    onError: (err: unknown) => setDeleteError(apiErrorMessage(err, 'Unable to delete incident.'))
  })

  const resolve = useMutation({
    mutationFn: (id: number) => updateIncident(id, {
      resolved: true,
      resolutionDate: new Date().toISOString().slice(0, 10)
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
    onError: (err: unknown) => window.alert(apiErrorMessage(err, 'Unable to mark incident as resolved.'))
  })

  function resetForm() {
    setForm({
      residentId: '',
      safehouseId: '',
      incidentDate: new Date().toISOString().slice(0, 10),
      incidentType: 'Behavioral',
      severity: 'Medium',
      description: '',
      responseTaken: '',
      reportedBy: '',
      resolved: 'false',
      followUpRequired: 'false',
      resolutionDate: ''
    })
    setEditId(null)
  }

  function openEdit(i: IncidentRow) {
    setEditId(i.incidentId)
    setForm({
      residentId: i.residentId ? String(i.residentId) : '',
      safehouseId: i.safehouseId ? String(i.safehouseId) : '',
      incidentDate: i.incidentDate?.slice(0, 10) || '',
      incidentType: i.incidentType || 'Behavioral',
      severity: i.severity || 'Medium',
      description: i.description || '',
      responseTaken: i.responseTaken || '',
      reportedBy: i.reportedBy || '',
      resolved: i.resolved ? 'true' : 'false',
      followUpRequired: i.followUpRequired ? 'true' : 'false',
      resolutionDate: i.resolutionDate?.slice(0, 10) || ''
    })
    setShowModal(true)
  }

  const unresolved = (incidents ?? []).filter((i: IncidentRow) => !i.resolved)
  const critical = (incidents ?? []).filter((i: IncidentRow) => i.severity === 'Critical' && !i.resolved)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Incident Reports</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span className="badge badge-red">{critical.length} critical open</span>
            <span className="badge badge-orange">{unresolved.length} total open</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}><Plus size={16} /> Report Incident</button>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={filter.severity} onChange={e => setFilter(p => ({ ...p, severity: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--surface-1)', color: 'var(--text)' }}>
            <option value="">All Severities</option>
            {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filter.resolved} onChange={e => setFilter(p => ({ ...p, resolved: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--surface-1)', color: 'var(--text)' }}>
            <option value="">All Status</option>
            <option value="false">Open</option>
            <option value="true">Resolved</option>
          </select>
        </div>
      </div>

      {isLoading ? <div className="loading-center"><div className="spinner" /></div>
        : (incidents ?? []).length === 0 ? (
          <div className="empty-state"><AlertTriangle size={40} /><h3>No incidents found</h3><p>No incidents match your current filters.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(incidents ?? []).map((i: IncidentRow) => (
              <div key={i.incidentId} className="card" style={{
                borderLeft: `4px solid ${i.severity === 'Critical' ? 'var(--danger)' : i.severity === 'High' ? 'var(--warning)' : 'var(--border)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className={SEVERITY_BADGE[i.severity] || 'badge badge-gray'}>{i.severity}</span>
                      <span className="badge badge-gray">{i.incidentType}</span>
                      {i.resolved && <span className="badge badge-green">Resolved</span>}
                      {i.followUpRequired && !i.resolved && <span className="badge badge-orange">Follow-up Required</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {i.incidentDate?.slice(0, 10)} · {i.safehouses?.name || '—'}
                      {i.residents?.caseControlNo ? ` · Case ${i.residents.caseControlNo}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!i.resolved && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => resolve.mutate(i.incidentId)}
                        disabled={resolve.isPending}
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(i)}>Edit</button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={remove.isPending}
                      onClick={() => {
                        setDeleteError('')
                        setDeleteTarget(i)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 8 }}>{i.description}</p>
                {i.responseTaken && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}><strong>Response Taken:</strong> {i.responseTaken}</p>}
                {i.reportedBy && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Reported by: {i.reportedBy}</p>}
              </div>
            ))}
          </div>
        )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit Incident' : 'Report Incident'}</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="grid-2">
              <div className="form-group"><label>Date</label><input type="date" value={form.incidentDate} onChange={e => setForm(p => ({ ...p, incidentDate: e.target.value }))} /></div>
              <div className="form-group"><label>Severity</label>
                <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                  {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Type</label>
                <select value={form.incidentType} onChange={e => setForm(p => ({ ...p, incidentType: e.target.value }))}>
                  {INCIDENT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Safehouse *</label>
                <select value={form.safehouseId} onChange={e => setForm(p => ({ ...p, safehouseId: e.target.value }))}>
                  <option value="">Select safehouse</option>
                  {(safehouses ?? []).map((s: SafehouseRow) => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Resident *</label>
                <select value={form.residentId} onChange={e => setForm(p => ({ ...p, residentId: e.target.value }))}>
                  <option value="">Select resident</option>
                  {(residents ?? []).map((r: ResidentRow) => (
                    <option key={r.residentId} value={r.residentId}>{r.caseControlNo || r.internalCode || `#${r.residentId}`}</option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label>Reported By *</label><input value={form.reportedBy} onChange={e => setForm(p => ({ ...p, reportedBy: e.target.value }))} placeholder="e.g. SW-19" /></div>
              <div className="form-group"><label>Resolved</label>
                <select
                  value={form.resolved}
                  onChange={e => setForm(p => ({
                    ...p,
                    resolved: e.target.value,
                    resolutionDate: e.target.value === 'true'
                      ? (p.resolutionDate || new Date().toISOString().slice(0, 10))
                      : ''
                  }))}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="form-group"><label>Follow-up Required</label>
                <select value={form.followUpRequired} onChange={e => setForm(p => ({ ...p, followUpRequired: e.target.value }))}>
                  <option value="false">No</option><option value="true">Yes</option>
                </select>
              </div>
              {form.resolved === 'true' && (
                <div className="form-group">
                  <label>Resolution Date</label>
                  <input type="date" value={form.resolutionDate} onChange={e => setForm(p => ({ ...p, resolutionDate: e.target.value }))} />
                </div>
              )}
            </div>
            <div className="form-group"><label>Description *</label><textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div className="form-group"><label>Response Taken</label><textarea rows={2} value={form.responseTaken} onChange={e => setForm(p => ({ ...p, responseTaken: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => editId ? update.mutate() : create.mutate()} disabled={!form.description || create.isPending || update.isPending}>
                {(create.isPending || update.isPending) ? 'Saving...' : editId ? 'Save Changes' : 'Report Incident'}
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
              <h2 style={{ margin: 0, fontSize: 20 }}>Delete incident</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This will permanently delete incident #{deleteTarget.incidentId}. This action cannot be undone.
            </p>
            {deleteError && <p style={{ margin: '12px 0 0', color: '#b91c1c', fontSize: 13 }}>{deleteError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setDeleteTarget(null); setDeleteError('') }}>Cancel</button>
              <button type="button" className="btn btn-danger" disabled={remove.isPending} onClick={() => remove.mutate(deleteTarget.incidentId)}>
                {remove.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
