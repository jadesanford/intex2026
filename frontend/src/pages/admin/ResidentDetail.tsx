import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getResident, getRecordings, addRecording,
  getVisitations, addVisitation, getHealthRecords, addHealthRecord,
  getEducationRecords, addEducationRecord, updateResident, getSafehouses
} from '../../lib/api'
import { ArrowLeft, Plus, ClipboardList, Home, Heart, BookOpen } from 'lucide-react'

const RISK_BADGE: Record<string, string> = {
  critical: 'badge badge-red', high: 'badge badge-orange',
  medium: 'badge badge-yellow', low: 'badge badge-green'
}

type Tab = 'overview' | 'recordings' | 'visitations' | 'health' | 'education'

export default function ResidentDetail() {
  const { id } = useParams<{ id: string }>()
  const rid = parseInt(id!)
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [showRecModal, setShowRecModal] = useState(false)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['resident', rid], queryFn: () => getResident(rid) })
  const { data: recordings } = useQuery({ queryKey: ['recordings', rid], queryFn: () => getRecordings(rid) })
  const { data: visitations } = useQuery({ queryKey: ['visitations', rid], queryFn: () => getVisitations(rid) })
  const { data: healthRecords } = useQuery({ queryKey: ['health', rid], queryFn: () => getHealthRecords(rid) })
  const { data: educationRecords } = useQuery({ queryKey: ['education', rid], queryFn: () => getEducationRecords(rid) })
  const { data: safehouses } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })

  const [recForm, setRecForm] = useState({ sessionDate: '', counselorName: '', sessionType: 'individual_counseling', emotionalState: '', notes: '', followUpActions: '', interventions: '' })
  const [visitForm, setVisitForm] = useState({ visitDate: '', visitType: 'routine_follow_up', visitorName: '', homeEnvironment: '', familyCooperation: 'good', safetyConcerns: '', followUpActions: '', notes: '' })
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  const r = data

  const addRec = useMutation({
    mutationFn: () => addRecording(rid, recForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recordings', rid] }); setShowRecModal(false) }
  })
  const addVisit = useMutation({
    mutationFn: () => addVisitation(rid, visitForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitations', rid] }); setShowVisitModal(false) }
  })
  const updateRes = useMutation({
    mutationFn: () => updateResident(rid, { ...r, ...editForm, safehouseId: editForm.safehouseId ? +editForm.safehouseId : r.safehouseId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resident', rid] }); setEditMode(false) }
  })

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>
  if (!r) return <div>Resident not found.</div>

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <ClipboardList size={15} /> },
    { id: 'recordings', label: `Process Recordings (${recordings?.length ?? 0})`, icon: <ClipboardList size={15} /> },
    { id: 'visitations', label: `Visitations (${visitations?.length ?? 0})`, icon: <Home size={15} /> },
    { id: 'health', label: `Health (${healthRecords?.length ?? 0})`, icon: <Heart size={15} /> },
    { id: 'education', label: `Education (${educationRecords?.length ?? 0})`, icon: <BookOpen size={15} /> },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link to="/admin/residents" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back to Caseload
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 28 }}>{r.caseCode}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <span className={RISK_BADGE[r.riskLevel] || 'badge badge-gray'}>{r.riskLevel} risk</span>
              <span className="badge badge-blue">{r.status}</span>
              <span className="badge badge-gray">{r.caseCategory?.replace('_', ' ')}</span>
            </div>
          </div>
          {!editMode
            ? <button className="btn btn-outline btn-sm" onClick={() => { setEditMode(true); setEditForm({ safehouseId: r.safehouseId?.toString() ?? '', riskLevel: r.riskLevel ?? '', status: r.status ?? '', reintegrationProgress: r.reintegrationProgress?.toString() ?? '0', notes: r.notes ?? '' }) }}>Edit</button>
            : <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={() => updateRes.mutate()}>Save</button>
              </div>
          }
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: '8px 8px 0 0', border: 'none',
            background: tab === t.id ? 'white' : 'transparent',
            color: tab === t.id ? 'var(--terracotta)' : 'var(--text-muted)',
            fontWeight: tab === t.id ? 600 : 400, fontSize: 13, cursor: 'pointer',
            borderBottom: tab === t.id ? '2px solid var(--terracotta)' : '2px solid transparent'
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Case Information</h3>
            {editMode ? (
              <div>
                <div className="form-group"><label>Risk Level</label>
                  <select value={editForm.riskLevel} onChange={e => setEditForm(p => ({ ...p, riskLevel: e.target.value }))}>
                    {['low', 'medium', 'high', 'critical'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                    {['active', 'reintegrated', 'transferred', 'discharged'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Safehouse</label>
                  <select value={editForm.safehouseId} onChange={e => setEditForm(p => ({ ...p, safehouseId: e.target.value }))}>
                    <option value="">None</option>
                    {(safehouses ?? []).map((s: { id: number; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Reintegration Progress (%)</label>
                  <input type="number" min="0" max="100" value={editForm.reintegrationProgress} onChange={e => setEditForm(p => ({ ...p, reintegrationProgress: e.target.value }))} />
                </div>
                <div className="form-group"><label>Notes</label>
                  <textarea rows={3} value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Safehouse', r.safehouses?.name || '—'],
                  ['Age', r.age ?? '—'],
                  ['Admission Date', r.admissionDate ?? '—'],
                  ['Referral Source', r.referralSource?.replace('_', ' ') || '—'],
                  ['Nationality', r.nationality || '—'],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Reintegration Progress</h3>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'Playfair Display, serif' }}>{r.reintegrationProgress ?? 0}%</div>
              <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden', marginTop: 20 }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--terracotta), var(--sage))', borderRadius: 6, width: `${r.reintegrationProgress ?? 0}%`, transition: 'width 0.5s' }} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>
                {r.notes || 'No notes recorded.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'recordings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowRecModal(true)}><Plus size={15} /> Add Recording</button>
          </div>
          {(recordings ?? []).length === 0 ? <div className="empty-state"><h3>No process recordings yet</h3></div>
            : (recordings ?? []).map((rec: { id: number; sessionDate: string; counselorName: string; sessionType: string; emotionalState: string; notes: string; followUpActions: string }) => (
              <div key={rec.id} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{rec.sessionDate}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{rec.counselorName} · {rec.sessionType?.replace('_', ' ')}</div>
                  </div>
                  <span className="badge badge-blue">{rec.emotionalState}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{rec.notes}</p>
                {rec.followUpActions && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}><strong>Follow-up:</strong> {rec.followUpActions}</p>}
              </div>
            ))
          }
          {showRecModal && (
            <div className="modal-overlay" onClick={() => setShowRecModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>Add Process Recording</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowRecModal(false)}>✕</button></div>
                <div className="grid-2">
                  <div className="form-group"><label>Session Date</label><input type="date" value={recForm.sessionDate} onChange={e => setRecForm(p => ({ ...p, sessionDate: e.target.value }))} /></div>
                  <div className="form-group"><label>Counselor Name</label><input value={recForm.counselorName} onChange={e => setRecForm(p => ({ ...p, counselorName: e.target.value }))} /></div>
                  <div className="form-group"><label>Session Type</label>
                    <select value={recForm.sessionType} onChange={e => setRecForm(p => ({ ...p, sessionType: e.target.value }))}>
                      {['individual_counseling', 'group_counseling', 'trauma_therapy', 'family_session', 'psychosocial'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Emotional State</label>
                    <select value={recForm.emotionalState} onChange={e => setRecForm(p => ({ ...p, emotionalState: e.target.value }))}>
                      {['calm', 'anxious', 'distressed', 'hopeful', 'neutral', 'stable', 'withdrawn'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Session Notes</label><textarea rows={4} value={recForm.notes} onChange={e => setRecForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div className="form-group"><label>Follow-up Actions</label><textarea rows={2} value={recForm.followUpActions} onChange={e => setRecForm(p => ({ ...p, followUpActions: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div className="form-group"><label>Interventions Applied</label><input value={recForm.interventions} onChange={e => setRecForm(p => ({ ...p, interventions: e.target.value }))} /></div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setShowRecModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => addRec.mutate()} disabled={addRec.isPending}>{addRec.isPending ? 'Saving...' : 'Save Recording'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'visitations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowVisitModal(true)}><Plus size={15} /> Log Visitation</button>
          </div>
          {(visitations ?? []).length === 0 ? <div className="empty-state"><h3>No visitations recorded yet</h3></div>
            : (visitations ?? []).map((v: { id: number; visitDate: string; visitType: string; visitorName: string; homeEnvironment: string; familyCooperation: string; safetyConcerns: string; followUpActions: string }) => (
              <div key={v.id} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{v.visitDate}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{v.visitType?.replace(/_/g, ' ')} · {v.visitorName}</div>
                  </div>
                  <span className={`badge ${v.familyCooperation === 'good' ? 'badge-green' : v.familyCooperation === 'poor' ? 'badge-red' : 'badge-yellow'}`}>{v.familyCooperation}</span>
                </div>
                {v.homeEnvironment && <p style={{ fontSize: 14 }}><strong>Home Environment:</strong> {v.homeEnvironment}</p>}
                {v.safetyConcerns && <p style={{ fontSize: 14, color: 'var(--danger)', marginTop: 6 }}><strong>Safety Concerns:</strong> {v.safetyConcerns}</p>}
                {v.followUpActions && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}><strong>Follow-up:</strong> {v.followUpActions}</p>}
              </div>
            ))
          }
          {showVisitModal && (
            <div className="modal-overlay" onClick={() => setShowVisitModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>Log Home Visitation</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowVisitModal(false)}>✕</button></div>
                <div className="grid-2">
                  <div className="form-group"><label>Visit Date</label><input type="date" value={visitForm.visitDate} onChange={e => setVisitForm(p => ({ ...p, visitDate: e.target.value }))} /></div>
                  <div className="form-group"><label>Visitor Name</label><input value={visitForm.visitorName} onChange={e => setVisitForm(p => ({ ...p, visitorName: e.target.value }))} /></div>
                  <div className="form-group"><label>Visit Type</label>
                    <select value={visitForm.visitType} onChange={e => setVisitForm(p => ({ ...p, visitType: e.target.value }))}>
                      {['initial_assessment', 'routine_follow_up', 'reintegration_assessment', 'post_placement_monitoring', 'emergency'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Family Cooperation</label>
                    <select value={visitForm.familyCooperation} onChange={e => setVisitForm(p => ({ ...p, familyCooperation: e.target.value }))}>
                      {['good', 'moderate', 'poor', 'none'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Home Environment</label><textarea rows={2} value={visitForm.homeEnvironment} onChange={e => setVisitForm(p => ({ ...p, homeEnvironment: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div className="form-group"><label>Safety Concerns</label><input value={visitForm.safetyConcerns} onChange={e => setVisitForm(p => ({ ...p, safetyConcerns: e.target.value }))} /></div>
                <div className="form-group"><label>Follow-up Actions</label><textarea rows={2} value={visitForm.followUpActions} onChange={e => setVisitForm(p => ({ ...p, followUpActions: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setShowVisitModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => addVisit.mutate()} disabled={addVisit.isPending}>{addVisit.isPending ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'health' && (
        <div>
          {(healthRecords ?? []).length === 0 ? <div className="empty-state"><h3>No health records yet</h3></div>
            : (healthRecords ?? []).map((h: { id: number; checkDate: string; condition: string; treatment: string; medicalProvider: string; notes: string }) => (
              <div key={h.id} className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.checkDate}</div>
                <div style={{ fontSize: 14 }}><strong>Condition:</strong> {h.condition}</div>
                {h.treatment && <div style={{ fontSize: 14, marginTop: 4 }}><strong>Treatment:</strong> {h.treatment}</div>}
                {h.medicalProvider && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Provider: {h.medicalProvider}</div>}
                {h.notes && <p style={{ fontSize: 13, marginTop: 6 }}>{h.notes}</p>}
              </div>
            ))
          }
        </div>
      )}

      {tab === 'education' && (
        <div>
          {(educationRecords ?? []).length === 0 ? <div className="empty-state"><h3>No education records yet</h3></div>
            : (educationRecords ?? []).map((e: { id: number; programType: string; institutionName: string; enrollmentDate: string; status: string; notes: string }) => (
              <div key={e.id} className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.institutionName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.programType?.replace('_', ' ')} · Enrolled {e.enrollmentDate}</div>
                  {e.notes && <div style={{ fontSize: 13, marginTop: 4 }}>{e.notes}</div>}
                </div>
                <span className={`badge ${e.status === 'active' ? 'badge-green' : e.status === 'completed' ? 'badge-blue' : 'badge-gray'}`}>{e.status}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
