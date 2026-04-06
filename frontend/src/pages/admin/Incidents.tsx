import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getIncidents, createIncident, updateIncident, getSafehouses, getResidents } from '../../lib/api'
import { Plus, AlertTriangle } from 'lucide-react'

const SEVERITY_BADGE: Record<string, string> = {
  low: 'badge badge-green', medium: 'badge badge-yellow',
  high: 'badge badge-orange', critical: 'badge badge-red'
}

export default function Incidents() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState({ resolved: '', severity: '' })
  const [form, setForm] = useState({ residentId: '', safehouseId: '', incidentDate: new Date().toISOString().slice(0, 10), incidentType: 'behavioral', severity: 'medium', description: '', actionTaken: '', reportedBy: '', resolved: 'false' })

  const params = { ...(filter.severity && { severity: filter.severity }), ...(filter.resolved !== '' && { resolved: filter.resolved === 'true' }) }
  const { data: incidents, isLoading } = useQuery({ queryKey: ['incidents', filter], queryFn: () => getIncidents(params as Record<string, string | boolean>) })
  const { data: safehouses } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })
  const { data: residents } = useQuery({ queryKey: ['residents'], queryFn: () => getResidents() })

  const create = useMutation({
    mutationFn: () => createIncident({ ...form, residentId: form.residentId ? +form.residentId : null, safehouseId: form.safehouseId ? +form.safehouseId : null, resolved: form.resolved === 'true' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setShowModal(false) }
  })

  const resolve = useMutation({
    mutationFn: (id: number) => updateIncident(id, { resolved: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] })
  })

  const unresolved = (incidents ?? []).filter((i: { resolved: boolean }) => !i.resolved)
  const critical = (incidents ?? []).filter((i: { severity: string; resolved: boolean }) => i.severity === 'critical' && !i.resolved)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Incidents</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span className="badge badge-red">{critical.length} critical open</span>
            <span className="badge badge-orange">{unresolved.length} total open</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Report Incident</button>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={filter.severity} onChange={e => setFilter(p => ({ ...p, severity: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
            <option value="">All Severities</option>
            {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filter.resolved} onChange={e => setFilter(p => ({ ...p, resolved: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
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
            {(incidents ?? []).map((i: { id: number; incidentDate: string; incidentType: string; severity: string; description: string; actionTaken: string; reportedBy: string; resolved: boolean; safehouses?: { name: string }; residents?: { caseCode: string } }) => (
              <div key={i.id} className="card" style={{ borderLeft: `4px solid ${i.severity === 'critical' ? 'var(--danger)' : i.severity === 'high' ? 'var(--warning)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span className={SEVERITY_BADGE[i.severity] || 'badge badge-gray'}>{i.severity}</span>
                      <span className="badge badge-gray">{i.incidentType?.replace('_', ' ')}</span>
                      {i.resolved && <span className="badge badge-green">Resolved</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {i.incidentDate?.slice(0, 10)} · {i.safehouses?.name || '—'} {i.residents?.caseCode ? `· Case ${i.residents.caseCode}` : ''}
                    </div>
                  </div>
                  {!i.resolved && (
                    <button className="btn btn-ghost btn-sm" onClick={() => resolve.mutate(i.id)}>Mark Resolved</button>
                  )}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 8 }}>{i.description}</p>
                {i.actionTaken && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}><strong>Action Taken:</strong> {i.actionTaken}</p>}
                {i.reportedBy && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Reported by: {i.reportedBy}</p>}
              </div>
            ))}
          </div>
        )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Report Incident</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="grid-2">
              <div className="form-group"><label>Date</label><input type="date" value={form.incidentDate} onChange={e => setForm(p => ({ ...p, incidentDate: e.target.value }))} /></div>
              <div className="form-group"><label>Severity</label>
                <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                  {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Type</label>
                <select value={form.incidentType} onChange={e => setForm(p => ({ ...p, incidentType: e.target.value }))}>
                  {['behavioral', 'health_emergency', 'escape_attempt', 'family_conflict', 'legal', 'self_harm', 'abuse', 'other'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Safehouse</label>
                <select value={form.safehouseId} onChange={e => setForm(p => ({ ...p, safehouseId: e.target.value }))}>
                  <option value="">Select safehouse</option>
                  {(safehouses ?? []).map((s: { id: number; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Resident (if applicable)</label>
                <select value={form.residentId} onChange={e => setForm(p => ({ ...p, residentId: e.target.value }))}>
                  <option value="">None</option>
                  {(residents ?? []).map((r: { id: number; caseCode: string }) => <option key={r.id} value={r.id}>{r.caseCode}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Reported By</label><input value={form.reportedBy} onChange={e => setForm(p => ({ ...p, reportedBy: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label>Description *</label><textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div className="form-group"><label>Action Taken</label><textarea rows={2} value={form.actionTaken} onChange={e => setForm(p => ({ ...p, actionTaken: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => create.mutate()} disabled={!form.description || create.isPending}>{create.isPending ? 'Saving...' : 'Report Incident'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
