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
const RELIGION_OPTIONS = [
  'Unspecified',
  'Roman Catholic',
  'Seventh-day Adventist',
  'Evangelical',
  'Buddhism',
  'Islam',
  "Jehovah's Witness",
  'Other'
]
const INITIAL_CASE_ASSESSMENT_OPTIONS = [
  'For Reunification',
  'For Continued Care',
  'For Independent Living',
  'For Adoption',
  'For Foster Care'
]
const CASE_CATEGORY_OPTIONS = ['Abandoned', 'Foundling', 'Surrendered', 'Neglected'] as const

type ResidentRow = {
  residentId: number; caseControlNo: string; internalCode: string;
  caseStatus: string; currentRiskLevel: string; caseCategory: string;
  presentAge: string; reintegrationStatus: string;
  safehouses?: { name: string; city: string }
}

type SafehouseRow = { safehouseId: number; name: string; city: string }

interface ResidentForm {
  caseControlNo: string; safehouseId: string;
  caseStatus: string; sex: string; dateOfBirth: string; birthStatus: string;
  placeOfBirth: string; religion: string; caseCategory: string;
  dateOfAdmission: string;
  referralSource: string; referringAgencyPerson: string;
  dateColbRegistered: string; dateColbObtained: string; dateCaseStudyPrepared: string;
  assignedSocialWorker: string; initialCaseAssessment: string;
  reintegrationType: string; reintegrationStatus: string;
  initialRiskLevel: string; currentRiskLevel: string;
  dateEnrolled: string; dateClosed: string; notesRestricted: string;
  subCatOrphaned: boolean; subCatTrafficked: boolean; subCatChildLabor: boolean;
  subCatPhysicalAbuse: boolean; subCatSexualAbuse: boolean; subCatOsaec: boolean;
  subCatCicl: boolean; subCatAtRisk: boolean; subCatStreetChild: boolean; subCatChildWithHiv: boolean;
  isPwd: boolean; pwdType: string; hasSpecialNeeds: boolean; specialNeedsDiagnosis: string;
  familyIs4ps: boolean; familySoloParent: boolean; familyIndigenous: boolean; familyParentPwd: boolean; familyInformalSettler: boolean;
}

const emptyForm: ResidentForm = {
  caseControlNo: '', safehouseId: '', caseStatus: 'Active', sex: 'F',
  dateOfBirth: '', birthStatus: 'Non-Marital', placeOfBirth: '', religion: '', caseCategory: 'Neglected',
  dateOfAdmission: '',
  referralSource: 'Government Agency', referringAgencyPerson: '',
  dateColbRegistered: '', dateColbObtained: '', dateCaseStudyPrepared: '',
  assignedSocialWorker: '', initialCaseAssessment: '',
  reintegrationType: 'None', reintegrationStatus: 'Not Started',
  initialRiskLevel: 'Medium', currentRiskLevel: 'Medium',
  dateEnrolled: '', dateClosed: '', notesRestricted: '',
  subCatOrphaned: false, subCatTrafficked: false, subCatChildLabor: false,
  subCatPhysicalAbuse: false, subCatSexualAbuse: false, subCatOsaec: false,
  subCatCicl: false, subCatAtRisk: false, subCatStreetChild: false, subCatChildWithHiv: false,
  isPwd: false, pwdType: '', hasSpecialNeeds: false, specialNeedsDiagnosis: '',
  familyIs4ps: false, familySoloParent: false, familyIndigenous: false, familyParentPwd: false, familyInformalSettler: false
}

export default function Residents() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ safehouseId: '', status: '', riskLevel: '', caseCategory: '', search: '' })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ResidentForm>(emptyForm)

  const { data: residents, isLoading } = useQuery({
    queryKey: ['residents', filters],
    queryFn: () => getResidents({
      pageSize: '200',
      ...(filters.safehouseId && { safehouseId: filters.safehouseId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
      ...(filters.caseCategory && { caseCategory: filters.caseCategory }),
    })
  })

  const { data: safehouses } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })

  const create = useMutation({
    mutationFn: () => createResident({
      caseControlNo: form.caseControlNo,
      safehouseId: form.safehouseId ? +form.safehouseId : null,
      sex: form.sex,
      dateOfBirth: form.dateOfBirth || null,
      birthStatus: form.birthStatus || null,
      placeOfBirth: form.placeOfBirth || null,
      religion: form.religion || null,
      caseStatus: form.caseStatus,
      currentRiskLevel: form.currentRiskLevel,
      initialRiskLevel: form.initialRiskLevel,
      caseCategory: form.caseCategory,
      subCatOrphaned: form.subCatOrphaned,
      referralSource: form.referralSource,
      referringAgencyPerson: form.referringAgencyPerson || null,
      dateColbRegistered: form.dateColbRegistered || null,
      dateColbObtained: form.dateColbObtained || null,
      dateCaseStudyPrepared: form.dateCaseStudyPrepared || null,
      assignedSocialWorker: form.assignedSocialWorker,
      initialCaseAssessment: form.initialCaseAssessment || null,
      reintegrationType: form.reintegrationType || null,
      reintegrationStatus: form.reintegrationStatus || null,
      dateOfAdmission: form.dateOfAdmission || null,
      dateEnrolled: form.dateEnrolled || null,
      dateClosed: form.dateClosed || null,
      notesRestricted: form.notesRestricted || null,
      subCatTrafficked: form.subCatTrafficked,
      subCatChildLabor: form.subCatChildLabor,
      subCatSexualAbuse: form.subCatSexualAbuse,
      subCatPhysicalAbuse: form.subCatPhysicalAbuse,
      subCatOsaec: form.subCatOsaec,
      subCatCicl: form.subCatCicl,
      subCatAtRisk: form.subCatAtRisk,
      subCatStreetChild: form.subCatStreetChild,
      subCatChildWithHiv: form.subCatChildWithHiv,
      isPwd: form.isPwd,
      pwdType: form.pwdType || null,
      hasSpecialNeeds: form.hasSpecialNeeds,
      specialNeedsDiagnosis: form.specialNeedsDiagnosis || null,
      familyIs4ps: form.familyIs4ps,
      familySoloParent: form.familySoloParent,
      familyIndigenous: form.familyIndigenous,
      familyParentPwd: form.familyParentPwd,
      familyInformalSettler: form.familyInformalSettler,
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
          <select value={filters.caseCategory} onChange={e => setFilters(p => ({ ...p, caseCategory: e.target.value }))}
            style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'white' }}>
            <option value="">All Categories</option>
            {CASE_CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
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
              <div className="form-group"><label>Birth Status</label>
                <select value={form.birthStatus} onChange={e => setForm(p => ({ ...p, birthStatus: e.target.value }))}>
                  {['Marital', 'Non-Marital'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Safehouse</label>
                <select value={form.safehouseId} onChange={e => setForm(p => ({ ...p, safehouseId: e.target.value }))}>
                  <option value="">Select safehouse</option>
                  {(safehouses ?? []).map((s: SafehouseRow) => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Sex</label><input value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value }))} /></div>
              <div className="form-group"><label>Admission Date</label><input type="date" value={form.dateOfAdmission} onChange={e => setForm(p => ({ ...p, dateOfAdmission: e.target.value }))} /></div>
              <div className="form-group"><label>Date Enrolled</label><input type="date" value={form.dateEnrolled} onChange={e => setForm(p => ({ ...p, dateEnrolled: e.target.value }))} /></div>
              <div className="form-group"><label>Date Closed</label><input type="date" value={form.dateClosed} onChange={e => setForm(p => ({ ...p, dateClosed: e.target.value }))} /></div>
              <div className="form-group"><label>Place of Birth</label><input value={form.placeOfBirth} onChange={e => setForm(p => ({ ...p, placeOfBirth: e.target.value }))} /></div>
              <div className="form-group"><label>Religion</label>
                <select value={form.religion} onChange={e => setForm(p => ({ ...p, religion: e.target.value }))}>
                  <option value="">Select religion</option>
                  {RELIGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Case Category</label>
                <select value={form.caseCategory} onChange={e => setForm(p => ({ ...p, caseCategory: e.target.value }))}>
                  {['Abandoned', 'Foundling', 'Surrendered', 'Neglected'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Initial Risk Level</label>
                <select value={form.initialRiskLevel} onChange={e => setForm(p => ({ ...p, initialRiskLevel: e.target.value }))}>
                  {['Low', 'Medium', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
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
              <div className="form-group"><label>Referring Agency/Person</label><input value={form.referringAgencyPerson} onChange={e => setForm(p => ({ ...p, referringAgencyPerson: e.target.value }))} /></div>
              <div className="form-group"><label>Reintegration Type</label>
                <select value={form.reintegrationType} onChange={e => setForm(p => ({ ...p, reintegrationType: e.target.value }))}>
                  {['Family Reunification', 'Foster Care', 'Adoption (Domestic)', 'Adoption (Inter-Country)', 'Independent Living', 'None'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Reintegration Status</label>
                <select value={form.reintegrationStatus} onChange={e => setForm(p => ({ ...p, reintegrationStatus: e.target.value }))}>
                  {['Not Started', 'In Progress', 'Completed', 'On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>COLB Registered Date</label><input type="date" value={form.dateColbRegistered} onChange={e => setForm(p => ({ ...p, dateColbRegistered: e.target.value }))} /></div>
              <div className="form-group"><label>COLB Obtained Date</label><input type="date" value={form.dateColbObtained} onChange={e => setForm(p => ({ ...p, dateColbObtained: e.target.value }))} /></div>
              <div className="form-group"><label>Case Study Prepared Date</label><input type="date" value={form.dateCaseStudyPrepared} onChange={e => setForm(p => ({ ...p, dateCaseStudyPrepared: e.target.value }))} /></div>
              <div className="form-group"><label>PWD Type</label><input value={form.pwdType} onChange={e => setForm(p => ({ ...p, pwdType: e.target.value }))} /></div>
              <div className="form-group"><label>Special Needs Diagnosis</label><input value={form.specialNeedsDiagnosis} onChange={e => setForm(p => ({ ...p, specialNeedsDiagnosis: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Assigned Social Worker</label><input value={form.assignedSocialWorker} onChange={e => setForm(p => ({ ...p, assignedSocialWorker: e.target.value }))} placeholder="SW-00" /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Initial Case Assessment</label>
                <select value={form.initialCaseAssessment} onChange={e => setForm(p => ({ ...p, initialCaseAssessment: e.target.value }))}>
                  <option value="">Select assessment</option>
                  {INITIAL_CASE_ASSESSMENT_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Restricted Notes</label><textarea rows={2} value={form.notesRestricted} onChange={e => setForm(p => ({ ...p, notesRestricted: e.target.value }))} /></div>
            </div>
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>Sub-categories</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  ['subCatOrphaned', 'Orphaned'],
                  ['subCatTrafficked', 'Trafficked'],
                  ['subCatChildLabor', 'Child Labor'],
                  ['subCatSexualAbuse', 'Sexual Abuse'],
                  ['subCatPhysicalAbuse', 'Physical Abuse'],
                  ['subCatOsaec', 'OSAEC/CSAEM'],
                  ['subCatCicl', 'CICL'],
                  ['subCatAtRisk', 'At Risk'],
                  ['subCatStreetChild', 'Street Child'],
                  ['subCatChildWithHiv', 'Child with HIV']
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[key as keyof ResidentForm] as boolean}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>Resident / Family Flags</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  ['isPwd', 'Resident is PWD'],
                  ['hasSpecialNeeds', 'Has Special Needs'],
                  ['familyIs4ps', 'Family is 4Ps'],
                  ['familySoloParent', 'Family Solo Parent'],
                  ['familyIndigenous', 'Family Indigenous'],
                  ['familyParentPwd', 'Family Parent PWD'],
                  ['familyInformalSettler', 'Family Informal Settler']
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
            {create.isError && (
              <div style={{ marginTop: 10, background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                {(create.error as any)?.response?.data?.message || 'Unable to save resident. Check required fields and duplicates (e.g., case number/internal code).'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
