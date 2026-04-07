import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getResident, getRecordings, addRecording,
  getVisitations, addVisitation, getHealthRecords,
  getEducationRecords, getInterventionPlans, updateResident, getSafehouses
} from '../../lib/api'
import { ArrowLeft, Plus, ClipboardList, Home, Heart, BookOpen, AlertTriangle } from 'lucide-react'

const RISK_BADGE: Record<string, string> = {
  Critical: 'badge badge-red', High: 'badge badge-orange',
  Medium: 'badge badge-yellow', Low: 'badge badge-green'
}

type Tab = 'overview' | 'recordings' | 'interventions' | 'visitations' | 'health' | 'education'

type RecordingRow = {
  recordingId: number; sessionDate: string; socialWorker: string; sessionType: string;
  emotionalStateObserved: string; sessionNarrative: string; followUpActions: string;
  progressNoted: boolean; concernsFlagged: boolean
}

type VisitationRow = {
  visitationId: number; visitDate: string; visitType: string; socialWorker: string;
  locationVisited: string; familyCooperationLevel: string; observations: string;
  safetyConcernsNoted: boolean; followUpNotes: string; visitOutcome: string
}

type HealthRow = {
  healthRecordId: number; recordDate: string; weightKg: number; heightCm: number;
  bmi: number; generalHealthScore: number; nutritionScore: number;
  medicalCheckupDone: boolean; dentalCheckupDone: boolean; psychologicalCheckupDone: boolean
}

type EducationRow = {
  educationRecordId: number; recordDate: string; programName: string; courseName: string;
  educationLevel: string; attendanceStatus: string; progressPercent: number;
  completionStatus: string; gpaLikeScore: number
}

type InterventionRow = {
  planId: number; residentId: number; planCategory: string; planDescription: string;
  servicesProvided: string; targetValue: number; targetDate: string; status: string;
  caseConferenceDate: string; createdAt: string; updatedAt: string
}

type SafehouseRow = { safehouseId: number; name: string }

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
  const { data: interventionPlans } = useQuery({ queryKey: ['interventions', rid], queryFn: () => getInterventionPlans(rid) })
  const { data: safehouses } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })

  const [recForm, setRecForm] = useState({
    sessionDate: '', socialWorker: '', sessionType: 'IndividualCounseling',
    emotionalStateObserved: 'Neutral', emotionalStateEnd: '',
    sessionNarrative: '', followUpActions: '', interventionsApplied: '',
    progressNoted: false, concernsFlagged: false, referralMade: false
  })
  const [visitForm, setVisitForm] = useState({
    visitDate: '', visitType: 'RoutineFollowUp', socialWorker: '',
    locationVisited: '', familyMembersPresent: '', purpose: '',
    observations: '', familyCooperationLevel: 'Good',
    safetyConcernsNoted: false, followUpNeeded: false, followUpNotes: '', visitOutcome: ''
  })
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
    mutationFn: () => updateResident(rid, {
      safehouseId: editForm.safehouseId ? +editForm.safehouseId : r?.safehouseId,
      currentRiskLevel: editForm.currentRiskLevel,
      caseStatus: editForm.caseStatus,
      reintegrationStatus: editForm.reintegrationStatus,
      assignedSocialWorker: editForm.assignedSocialWorker,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resident', rid] }); setEditMode(false) }
  })

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>
  if (!r) return <div>Resident not found.</div>

  // If data returned wraps resident in object
  const resident = r.resident ?? r
  const sh = r.safehouses

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <ClipboardList size={15} /> },
    { id: 'recordings', label: `Process Recordings (${recordings?.length ?? 0})`, icon: <ClipboardList size={15} /> },
    { id: 'interventions', label: `Intervention Plans (${interventionPlans?.length ?? 0})`, icon: <ClipboardList size={15} /> },
    { id: 'visitations', label: `Visitations (${visitations?.length ?? 0})`, icon: <Home size={15} /> },
    { id: 'health', label: `Health (${healthRecords?.length ?? 0})`, icon: <Heart size={15} /> },
    { id: 'education', label: `Education (${educationRecords?.length ?? 0})`, icon: <BookOpen size={15} /> },
  ]

  const subCats = [
    ['Trafficked', resident.subCatTrafficked],
    ['Sexual Abuse', resident.subCatSexualAbuse],
    ['Physical Abuse', resident.subCatPhysicalAbuse],
    ['OSAEC/CSAEM', resident.subCatOsaec],
    ['Child Labor', resident.subCatChildLabor],
    ['CICL', resident.subCatCicl],
    ['At Risk', resident.subCatAtRisk],
  ].filter(([, v]) => v)

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link to="/admin/residents" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back to Caseload
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 28, fontFamily: 'monospace' }}>{resident.caseControlNo || resident.internalCode || `Resident #${rid}`}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span className={RISK_BADGE[resident.currentRiskLevel] || 'badge badge-gray'}>{resident.currentRiskLevel} risk</span>
              <span className="badge badge-blue">{resident.caseStatus}</span>
              <span className="badge badge-gray">{resident.caseCategory}</span>
              {subCats.map(([label]) => <span key={label as string} className="badge badge-orange">{label as string}</span>)}
            </div>
          </div>
          {!editMode
            ? <button className="btn btn-outline btn-sm" onClick={() => {
                setEditMode(true)
                setEditForm({
                  safehouseId: resident.safehouseId?.toString() ?? '',
                  currentRiskLevel: resident.currentRiskLevel ?? 'Medium',
                  caseStatus: resident.caseStatus ?? 'Active',
                  reintegrationStatus: resident.reintegrationStatus ?? 'Not Started',
                  assignedSocialWorker: resident.assignedSocialWorker ?? ''
                })
              }}>Edit</button>
            : <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={() => updateRes.mutate()}>Save</button>
              </div>
          }
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
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
                  <select value={editForm.currentRiskLevel} onChange={e => setEditForm(p => ({ ...p, currentRiskLevel: e.target.value }))}>
                    {['Low', 'Medium', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Case Status</label>
                  <select value={editForm.caseStatus} onChange={e => setEditForm(p => ({ ...p, caseStatus: e.target.value }))}>
                    {['Active', 'Closed', 'Transferred'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Reintegration Status</label>
                  <select value={editForm.reintegrationStatus} onChange={e => setEditForm(p => ({ ...p, reintegrationStatus: e.target.value }))}>
                    {['Not Started', 'In Progress', 'Completed', 'On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Safehouse</label>
                  <select value={editForm.safehouseId} onChange={e => setEditForm(p => ({ ...p, safehouseId: e.target.value }))}>
                    <option value="">None</option>
                    {(safehouses ?? []).map((s: SafehouseRow) => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Assigned Social Worker</label>
                  <input value={editForm.assignedSocialWorker} onChange={e => setEditForm(p => ({ ...p, assignedSocialWorker: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Case Control No.', resident.caseControlNo || '—'],
                  ['Internal Code', resident.internalCode || '—'],
                  ['Safehouse', sh?.name || resident.safehouses?.name || '—'],
                  ['Date of Birth', resident.dateOfBirth || '—'],
                  ['Date of Admission', resident.dateOfAdmission || '—'],
                  ['Referral Source', resident.referralSource || '—'],
                  ['Assigned Social Worker', resident.assignedSocialWorker || '—'],
                  ['Reintegration Type', resident.reintegrationType || '—'],
                  ['Reintegration Status', resident.reintegrationStatus || 'Not Started'],
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
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Reintegration & Risk</h3>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: RISK_BADGE[resident.currentRiskLevel]?.includes('red') ? 'var(--danger)' : 'var(--terracotta)', fontFamily: 'Playfair Display, serif' }}>
                {resident.currentRiskLevel}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Current Risk Level</div>
              <div style={{ marginTop: 20, fontSize: 15, fontWeight: 600 }}>{resident.reintegrationStatus || 'Not Started'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Reintegration Status</div>
            </div>
            {resident.initialCaseAssessment && (
              <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {resident.initialCaseAssessment}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'recordings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowRecModal(true)}><Plus size={15} /> Add Recording</button>
          </div>
          {(recordings ?? []).length === 0
            ? <div className="empty-state"><h3>No process recordings yet</h3></div>
            : (recordings ?? []).map((rec: RecordingRow) => (
              <div key={rec.recordingId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{rec.sessionDate}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{rec.socialWorker} · {rec.sessionType}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {rec.emotionalStateObserved && <span className="badge badge-blue">{rec.emotionalStateObserved}</span>}
                    {rec.progressNoted && <span className="badge badge-green">Progress</span>}
                    {rec.concernsFlagged && <span className="badge badge-red">Concern</span>}
                  </div>
                </div>
                {rec.sessionNarrative && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{rec.sessionNarrative}</p>}
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
                  <div className="form-group"><label>Social Worker</label><input value={recForm.socialWorker} onChange={e => setRecForm(p => ({ ...p, socialWorker: e.target.value }))} /></div>
                  <div className="form-group"><label>Session Type</label>
                    <select value={recForm.sessionType} onChange={e => setRecForm(p => ({ ...p, sessionType: e.target.value }))}>
                      {['IndividualCounseling', 'GroupCounseling', 'TraumaTherapy', 'FamilySession', 'Psychosocial', 'SkillsTraining', 'ReintegrationPlanning'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Emotional State (Start)</label>
                    <select value={recForm.emotionalStateObserved} onChange={e => setRecForm(p => ({ ...p, emotionalStateObserved: e.target.value }))}>
                      {['Calm', 'Anxious', 'Distressed', 'Hopeful', 'Neutral', 'Stable', 'Withdrawn', 'Angry'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Emotional State (End)</label>
                    <select value={recForm.emotionalStateEnd} onChange={e => setRecForm(p => ({ ...p, emotionalStateEnd: e.target.value }))}>
                      <option value="">Same / Not noted</option>
                      {['Calm', 'Anxious', 'Distressed', 'Hopeful', 'Neutral', 'Stable', 'Withdrawn', 'Angry'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Interventions Applied</label>
                    <input value={recForm.interventionsApplied} onChange={e => setRecForm(p => ({ ...p, interventionsApplied: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group"><label>Session Narrative</label><textarea rows={4} value={recForm.sessionNarrative} onChange={e => setRecForm(p => ({ ...p, sessionNarrative: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div className="form-group"><label>Follow-up Actions</label><textarea rows={2} value={recForm.followUpActions} onChange={e => setRecForm(p => ({ ...p, followUpActions: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  {[['progressNoted', 'Progress Noted'], ['concernsFlagged', 'Concerns Flagged'], ['referralMade', 'Referral Made']].map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={recForm[key as keyof typeof recForm] as boolean}
                        onChange={e => setRecForm(p => ({ ...p, [key]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
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
          {(visitations ?? []).length === 0
            ? <div className="empty-state"><h3>No visitations recorded yet</h3></div>
            : (visitations ?? []).map((v: VisitationRow) => (
              <div key={v.visitationId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{v.visitDate}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{v.visitType} · {v.socialWorker}</div>
                    {v.locationVisited && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {v.locationVisited}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge ${v.familyCooperationLevel === 'Good' ? 'badge-green' : v.familyCooperationLevel === 'Poor' ? 'badge-red' : 'badge-yellow'}`}>{v.familyCooperationLevel}</span>
                    {v.safetyConcernsNoted && <span className="badge badge-red"><AlertTriangle size={12} /> Safety</span>}
                  </div>
                </div>
                {v.observations && <p style={{ fontSize: 14 }}>{v.observations}</p>}
                {v.visitOutcome && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}><strong>Outcome:</strong> {v.visitOutcome}</p>}
                {v.followUpNotes && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}><strong>Follow-up:</strong> {v.followUpNotes}</p>}
              </div>
            ))
          }
          {showVisitModal && (
            <div className="modal-overlay" onClick={() => setShowVisitModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>Log Home Visitation</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowVisitModal(false)}>✕</button></div>
                <div className="grid-2">
                  <div className="form-group"><label>Visit Date</label><input type="date" value={visitForm.visitDate} onChange={e => setVisitForm(p => ({ ...p, visitDate: e.target.value }))} /></div>
                  <div className="form-group"><label>Social Worker</label><input value={visitForm.socialWorker} onChange={e => setVisitForm(p => ({ ...p, socialWorker: e.target.value }))} /></div>
                  <div className="form-group"><label>Visit Type</label>
                    <select value={visitForm.visitType} onChange={e => setVisitForm(p => ({ ...p, visitType: e.target.value }))}>
                      {['InitialAssessment', 'RoutineFollowUp', 'ReintegrationAssessment', 'PostPlacementMonitoring', 'Emergency'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Family Cooperation</label>
                    <select value={visitForm.familyCooperationLevel} onChange={e => setVisitForm(p => ({ ...p, familyCooperationLevel: e.target.value }))}>
                      {['Good', 'Moderate', 'Poor', 'None'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Location Visited</label><input value={visitForm.locationVisited} onChange={e => setVisitForm(p => ({ ...p, locationVisited: e.target.value }))} /></div>
                  <div className="form-group"><label>Family Members Present</label><input value={visitForm.familyMembersPresent} onChange={e => setVisitForm(p => ({ ...p, familyMembersPresent: e.target.value }))} /></div>
                </div>
                <div className="form-group"><label>Purpose</label><input value={visitForm.purpose} onChange={e => setVisitForm(p => ({ ...p, purpose: e.target.value }))} /></div>
                <div className="form-group"><label>Observations</label><textarea rows={3} value={visitForm.observations} onChange={e => setVisitForm(p => ({ ...p, observations: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div className="form-group"><label>Visit Outcome</label><input value={visitForm.visitOutcome} onChange={e => setVisitForm(p => ({ ...p, visitOutcome: e.target.value }))} /></div>
                <div className="form-group"><label>Follow-up Notes</label><textarea rows={2} value={visitForm.followUpNotes} onChange={e => setVisitForm(p => ({ ...p, followUpNotes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  {[['safetyConcernsNoted', 'Safety Concerns'], ['followUpNeeded', 'Follow-up Needed']].map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={visitForm[key as keyof typeof visitForm] as boolean}
                        onChange={e => setVisitForm(p => ({ ...p, [key]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setShowVisitModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => addVisit.mutate()} disabled={addVisit.isPending}>{addVisit.isPending ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'interventions' && (
        <div>
          {(interventionPlans ?? []).length === 0
            ? <div className="empty-state"><h3>No intervention plans yet</h3></div>
            : <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Services Provided</th>
                      <th>Target</th>
                      <th>Status</th>
                      <th>Target Date</th>
                      <th>Case Conference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(interventionPlans ?? []).map((p: InterventionRow) => (
                      <tr key={p.planId}>
                        <td>{p.planCategory || '—'}</td>
                        <td style={{ maxWidth: 360 }}>{p.planDescription || '—'}</td>
                        <td>{p.servicesProvided || '—'}</td>
                        <td>{p.targetValue ?? '—'}</td>
                        <td>
                          <span className={`badge ${
                            p.status === 'Achieved' ? 'badge-green'
                              : p.status === 'In Progress' ? 'badge-blue'
                              : p.status === 'On Hold' ? 'badge-yellow'
                              : 'badge-gray'
                          }`}>
                            {p.status || '—'}
                          </span>
                        </td>
                        <td>{p.targetDate || '—'}</td>
                        <td>{p.caseConferenceDate || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {tab === 'health' && (
        <div>
          {(healthRecords ?? []).length === 0
            ? <div className="empty-state"><h3>No health records yet</h3></div>
            : (healthRecords ?? []).map((h: HealthRow) => (
              <div key={h.healthRecordId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>{h.recordDate}</div>
                <div className="grid-3">
                  {h.weightKg && <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--terracotta)' }}>{h.weightKg} kg</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Weight</div>
                  </div>}
                  {h.heightCm && <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)' }}>{h.heightCm} cm</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Height</div>
                  </div>}
                  {h.bmi && <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--sage)' }}>{h.bmi}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>BMI</div>
                  </div>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {h.medicalCheckupDone && <span className="badge badge-green">Medical ✓</span>}
                  {h.dentalCheckupDone && <span className="badge badge-blue">Dental ✓</span>}
                  {h.psychologicalCheckupDone && <span className="badge badge-purple">Psych ✓</span>}
                </div>
                {h.generalHealthScore && (
                  <div style={{ marginTop: 12, fontSize: 13 }}>
                    General Health Score: <strong>{h.generalHealthScore}/10</strong>
                    {h.nutritionScore && <> · Nutrition: <strong>{h.nutritionScore}/10</strong></>}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}

      {tab === 'education' && (
        <div>
          {(educationRecords ?? []).length === 0
            ? <div className="empty-state"><h3>No education records yet</h3></div>
            : (educationRecords ?? []).map((e: EducationRow) => (
              <div key={e.educationRecordId} className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.programName || e.courseName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{e.educationLevel} · {e.recordDate}</div>
                  {e.progressPercent != null && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Progress: {e.progressPercent}%</div>
                      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', width: 200 }}>
                        <div style={{ height: '100%', background: 'var(--sage)', borderRadius: 3, width: `${e.progressPercent}%` }} />
                      </div>
                    </div>
                  )}
                  {e.attendanceStatus && <div style={{ fontSize: 13, marginTop: 4 }}>Attendance: {e.attendanceStatus}</div>}
                  {e.gpaLikeScore && <div style={{ fontSize: 13 }}>GPA-like Score: {e.gpaLikeScore}</div>}
                </div>
                <span className={`badge ${e.completionStatus === 'Completed' ? 'badge-green' : e.completionStatus === 'Enrolled' ? 'badge-blue' : 'badge-gray'}`}>
                  {e.completionStatus || 'Enrolled'}
                </span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
