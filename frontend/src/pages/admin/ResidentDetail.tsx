import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getResident, getRecordings, addRecording, updateRecording, deleteRecording,
  getVisitations, addVisitation, updateVisitation, deleteVisitation, getHealthRecords, addHealthRecord, updateHealthRecord, deleteHealthRecord,
  getEducationRecords, addEducationRecord, updateEducationRecord, deleteEducationRecord,
  getInterventionPlans, addInterventionPlan, updateInterventionPlan, deleteInterventionPlan, updateResident, getSafehouses, deleteResident
} from '../../lib/api'
import { ArrowLeft, Plus, ClipboardList, Home, Heart, BookOpen, AlertTriangle } from 'lucide-react'

const RISK_BADGE: Record<string, string> = {
  Critical: 'badge badge-red', High: 'badge badge-orange',
  Medium: 'badge badge-yellow', Low: 'badge badge-green'
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
const INTERVENTIONS_APPLIED_OPTIONS = [
  'Caring',
  'Healing',
  'Teaching',
  'Legal Services'
]
const FOLLOW_UP_ACTION_OPTIONS = [
  'Referral to specialist',
  'Schedule follow-up session',
  'Continue current approach',
  'Coordinate with family',
  'Monitor progress'
]
const VISIT_TYPE_OPTIONS = [
  'Initial Assessment',
  'Routine Follow-Up',
  'Reintegration Assessment',
  'Post-Placement Monitoring',
  'Emergency'
]
const VISIT_LOCATION_OPTIONS = [
  'Proposed Foster Home',
  'Church',
  'Barangay Office',
  'Community Center',
  'Family Home',
  'School'
]
const VISIT_PURPOSE_OPTIONS = [
  'Visitation for initial assessment',
  'Visitation for routine follow-up',
  'Visitation for reintegration assessment',
  'Visitation for post-placement monitoring',
  'Visitation for emergency'
]
const VISIT_OBSERVATION_OPTIONS = [
  'Visit observations recorded during initial assessment.',
  'Visit observations recorded during routine follow-up.',
  'Visit observations recorded during reintegration assessment.',
  'Visit observations recorded during post-placement monitoring.',
  'Visit observations recorded during emergency.'
]

const EDUCATION_LEVEL_OPTIONS = ['Primary', 'Secondary', 'Vocational', 'CollegePrep'] as const
const EDUCATION_ENROLLMENT_OPTIONS = ['Enrolled', 'Withdrawn', 'Completed', 'OnHold', 'Pending'] as const
const EDUCATION_COMPLETION_OPTIONS = ['NotStarted', 'InProgress', 'Completed'] as const
const EDUCATION_SCHOOL_OPTIONS = Array.from({ length: 30 }, (_, i) => `School ${i + 1}`)
const EDUCATION_SCHOOL_OTHER = '__other__'

type Tab = 'overview' | 'recordings' | 'interventions' | 'visitations' | 'health' | 'education'

type RecordingRow = {
  recordingId: number; sessionDate: string; socialWorker: string; sessionType: string;
  sessionDurationMinutes: number; emotionalStateObserved: string; emotionalStateEnd: string;
  sessionNarrative: string; interventionsApplied: string; followUpActions: string; notesRestricted: string;
  progressNoted: boolean; concernsFlagged: boolean; referralMade?: boolean
}

type VisitationRow = {
  visitationId: number; visitDate: string; visitType: string; socialWorker: string;
  locationVisited: string; familyMembersPresent?: string; purpose?: string;
  familyCooperationLevel: string; observations: string; followUpNeeded?: boolean;
  safetyConcernsNoted: boolean; followUpNotes: string; visitOutcome: string
}

type HealthRow = {
  healthRecordId: number; recordDate: string; weightKg: number; heightCm: number;
  bmi: number; generalHealthScore: number; nutritionScore: number; sleepQualityScore?: number; energyLevelScore?: number;
  medicalCheckupDone: boolean; dentalCheckupDone: boolean; psychologicalCheckupDone: boolean; notes?: string
}

type EducationRow = {
  educationRecordId: number
  recordDate: string
  schoolName?: string
  enrollmentStatus?: string
  educationLevel?: string
  attendanceRate?: number
  progressPercent?: number
  completionStatus?: string
  notes?: string
}

type InterventionRow = {
  planId: number; residentId: number; planCategory: string; planDescription: string;
  servicesProvided: string; targetValue: number; targetDate: string; status: string;
  caseConferenceDate: string; createdAt: string; updatedAt: string
}

type SafehouseRow = { safehouseId: number; name: string }
type DeleteTarget =
  | { kind: 'resident' }
  | { kind: 'recording'; recordingId: number }
  | { kind: 'visitation'; visitationId: number }
  | { kind: 'intervention'; planId: number }
  | { kind: 'health'; healthRecordId: number }
  | { kind: 'education'; educationRecordId: number }

export default function ResidentDetail() {
  const { id } = useParams<{ id: string }>()
  const rid = parseInt(id!)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [showRecModal, setShowRecModal] = useState(false)
  const [editingRecordingId, setEditingRecordingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget | null>(null)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [editingVisitationId, setEditingVisitationId] = useState<number | null>(null)
  const [visitationError, setVisitationError] = useState('')
  const [showInterventionModal, setShowInterventionModal] = useState(false)
  const [editingInterventionId, setEditingInterventionId] = useState<number | null>(null)
  const [interventionError, setInterventionError] = useState('')
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [editingHealthRecordId, setEditingHealthRecordId] = useState<number | null>(null)
  const [healthError, setHealthError] = useState('')
  const [showEducationModal, setShowEducationModal] = useState(false)
  const [editingEducationRecordId, setEditingEducationRecordId] = useState<number | null>(null)
  const [educationError, setEducationError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['resident', rid], queryFn: () => getResident(rid) })
  const { data: recordings } = useQuery({ queryKey: ['recordings', rid], queryFn: () => getRecordings(rid) })
  const { data: visitations } = useQuery({ queryKey: ['visitations', rid], queryFn: () => getVisitations(rid) })
  const { data: healthRecords } = useQuery({ queryKey: ['health', rid], queryFn: () => getHealthRecords(rid) })
  const { data: educationRecords } = useQuery({ queryKey: ['education', rid], queryFn: () => getEducationRecords(rid) })
  const { data: interventionPlans } = useQuery({ queryKey: ['interventions', rid], queryFn: () => getInterventionPlans(rid) })
  const { data: safehouses } = useQuery({ queryKey: ['safehouses'], queryFn: getSafehouses })

  const [recForm, setRecForm] = useState({
    sessionDate: '', socialWorker: '', sessionType: 'Individual',
    sessionDurationMinutes: 60,
    emotionalStateObserved: 'Calm', emotionalStateEnd: 'Calm',
    sessionNarrative: '', followUpActions: [] as string[], interventionsApplied: [] as string[],
    progressNoted: false, concernsFlagged: false, referralMade: false, notesRestricted: ''
  })
  const resetRecForm = () => setRecForm({
    sessionDate: '', socialWorker: '', sessionType: 'Individual',
    sessionDurationMinutes: 60,
    emotionalStateObserved: 'Calm', emotionalStateEnd: 'Calm',
    sessionNarrative: '', followUpActions: [] as string[], interventionsApplied: [] as string[],
    progressNoted: false, concernsFlagged: false, referralMade: false, notesRestricted: ''
  })
  const [visitForm, setVisitForm] = useState({
    visitDate: '', visitType: 'Routine Follow-Up', socialWorker: '',
    locationVisited: 'Family Home', familyMembersPresent: '', purpose: 'Visitation for routine follow-up',
    observations: 'Visit observations recorded during routine follow-up.', familyCooperationLevel: 'Cooperative',
    safetyConcernsNoted: false, followUpNeeded: false, followUpNotes: '', visitOutcome: ''
  })
  const resetVisitForm = () => setVisitForm({
    visitDate: '', visitType: 'Routine Follow-Up', socialWorker: '',
    locationVisited: 'Family Home', familyMembersPresent: '', purpose: 'Visitation for routine follow-up',
    observations: 'Visit observations recorded during routine follow-up.', familyCooperationLevel: 'Cooperative',
    safetyConcernsNoted: false, followUpNeeded: false, followUpNotes: '', visitOutcome: ''
  })
  const [editForm, setEditForm] = useState<Record<string, any>>({})
  const [healthForm, setHealthForm] = useState({
    recordDate: '',
    weightKg: '',
    heightCm: '',
    bmi: '',
    nutritionScore: '',
    sleepScore: '',
    energyScore: '',
    generalHealthScore: '',
    medicalCheckupDone: false,
    dentalCheckupDone: false,
    psychologicalCheckupDone: false,
    medicalNotesRestricted: ''
  })
  const resetHealthForm = () => setHealthForm({
    recordDate: '',
    weightKg: '',
    heightCm: '',
    bmi: '',
    nutritionScore: '',
    sleepScore: '',
    energyScore: '',
    generalHealthScore: '',
    medicalCheckupDone: false,
    dentalCheckupDone: false,
    psychologicalCheckupDone: false,
    medicalNotesRestricted: ''
  })
  const [interventionForm, setInterventionForm] = useState({
    planCategory: 'Safety',
    planDescription: '',
    servicesProvided: [] as string[],
    targetValue: '',
    targetDate: '',
    status: 'Open',
    caseConferenceDate: ''
  })
  const resetInterventionForm = () => setInterventionForm({
    planCategory: 'Safety',
    planDescription: '',
    servicesProvided: [] as string[],
    targetValue: '',
    targetDate: '',
    status: 'Open',
    caseConferenceDate: ''
  })
  const [educationForm, setEducationForm] = useState({
    recordDate: '',
    schoolPick: EDUCATION_SCHOOL_OPTIONS[0],
    schoolCustom: '',
    educationLevel: 'Primary' as (typeof EDUCATION_LEVEL_OPTIONS)[number],
    enrollmentStatus: 'Enrolled' as (typeof EDUCATION_ENROLLMENT_OPTIONS)[number],
    attendanceRate: '',
    progressPercent: '',
    completionStatus: 'NotStarted' as (typeof EDUCATION_COMPLETION_OPTIONS)[number],
    notes: ''
  })
  const educationSchoolNamePayload = () => {
    if (educationForm.schoolPick === EDUCATION_SCHOOL_OTHER)
      return educationForm.schoolCustom.trim() || null
    return educationForm.schoolPick || null
  }
  const resetEducationForm = () => setEducationForm({
    recordDate: '',
    schoolPick: EDUCATION_SCHOOL_OPTIONS[0],
    schoolCustom: '',
    educationLevel: 'Primary',
    enrollmentStatus: 'Enrolled',
    attendanceRate: '',
    progressPercent: '',
    completionStatus: 'NotStarted',
    notes: ''
  })

  const r = data

  const addRec = useMutation({
    mutationFn: () => addRecording(rid, {
      ...recForm,
      interventionsApplied: recForm.interventionsApplied.join(', '),
      followUpActions: recForm.followUpActions.join(', ')
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recordings', rid] })
      setEditingRecordingId(null)
      setShowRecModal(false)
      resetRecForm()
    }
  })
  const editRec = useMutation({
    mutationFn: (recordingId: number) => updateRecording(rid, recordingId, {
      ...recForm,
      interventionsApplied: recForm.interventionsApplied.join(', '),
      followUpActions: recForm.followUpActions.join(', ')
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recordings', rid] })
      setEditingRecordingId(null)
      setShowRecModal(false)
      resetRecForm()
    }
  })
  const deleteRec = useMutation({
    mutationFn: (recordingId: number) => deleteRecording(rid, recordingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recordings', rid] })
    }
  })
  const addVisit = useMutation({
    mutationFn: () => addVisitation(rid, visitForm),
    onSuccess: () => {
      setVisitationError('')
      qc.invalidateQueries({ queryKey: ['visitations', rid] })
      setEditingVisitationId(null)
      setShowVisitModal(false)
      resetVisitForm()
    },
    onError: (err: any) => setVisitationError(err?.response?.data?.message || 'Unable to save visitation.')
  })
  const editVisit = useMutation({
    mutationFn: (visitationId: number) => updateVisitation(rid, visitationId, visitForm),
    onSuccess: () => {
      setVisitationError('')
      qc.invalidateQueries({ queryKey: ['visitations', rid] })
      setEditingVisitationId(null)
      setShowVisitModal(false)
      resetVisitForm()
    },
    onError: (err: any) => setVisitationError(err?.response?.data?.message || 'Unable to update visitation.')
  })
  const deleteVisit = useMutation({
    mutationFn: (visitationId: number) => deleteVisitation(rid, visitationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visitations', rid] })
  })
  const addPlan = useMutation({
    mutationFn: () => addInterventionPlan(rid, {
      ...interventionForm,
      servicesProvided: interventionForm.servicesProvided.join(', '),
      targetValue: interventionForm.targetValue === '' ? null : Number(interventionForm.targetValue)
    }),
    onSuccess: () => {
      setInterventionError('')
      qc.invalidateQueries({ queryKey: ['interventions', rid] })
      setEditingInterventionId(null)
      setShowInterventionModal(false)
      resetInterventionForm()
    },
    onError: (err: any) => setInterventionError(err?.response?.data?.message || 'Unable to save intervention plan.')
  })
  const editPlan = useMutation({
    mutationFn: (planId: number) => updateInterventionPlan(rid, planId, {
      ...interventionForm,
      servicesProvided: interventionForm.servicesProvided.join(', '),
      targetValue: interventionForm.targetValue === '' ? null : Number(interventionForm.targetValue)
    }),
    onSuccess: () => {
      setInterventionError('')
      qc.invalidateQueries({ queryKey: ['interventions', rid] })
      setEditingInterventionId(null)
      setShowInterventionModal(false)
      resetInterventionForm()
    },
    onError: (err: any) => setInterventionError(err?.response?.data?.message || 'Unable to update intervention plan.')
  })
  const deletePlan = useMutation({
    mutationFn: (planId: number) => deleteInterventionPlan(rid, planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interventions', rid] })
  })
  const addHealth = useMutation({
    mutationFn: () => addHealthRecord(rid, {
      ...healthForm,
      weightKg: healthForm.weightKg === '' ? null : Number(healthForm.weightKg),
      heightCm: healthForm.heightCm === '' ? null : Number(healthForm.heightCm),
      bmi: healthForm.bmi === '' ? null : Number(healthForm.bmi),
      nutritionScore: healthForm.nutritionScore === '' ? null : Number(healthForm.nutritionScore),
      sleepScore: healthForm.sleepScore === '' ? null : Number(healthForm.sleepScore),
      energyScore: healthForm.energyScore === '' ? null : Number(healthForm.energyScore),
      generalHealthScore: healthForm.generalHealthScore === '' ? null : Number(healthForm.generalHealthScore),
    }),
    onSuccess: () => {
      setHealthError('')
      qc.invalidateQueries({ queryKey: ['health', rid] })
      setEditingHealthRecordId(null)
      setShowHealthModal(false)
      resetHealthForm()
    },
    onError: (err: any) => {
      const d = err?.response?.data
      setHealthError([d?.message, d?.detail].filter(Boolean).join(' ') || 'Unable to add health record.')
    }
  })
  const editHealth = useMutation({
    mutationFn: (healthRecordId: number) => updateHealthRecord(rid, healthRecordId, {
      ...healthForm,
      weightKg: healthForm.weightKg === '' ? null : Number(healthForm.weightKg),
      heightCm: healthForm.heightCm === '' ? null : Number(healthForm.heightCm),
      bmi: healthForm.bmi === '' ? null : Number(healthForm.bmi),
      nutritionScore: healthForm.nutritionScore === '' ? null : Number(healthForm.nutritionScore),
      sleepScore: healthForm.sleepScore === '' ? null : Number(healthForm.sleepScore),
      energyScore: healthForm.energyScore === '' ? null : Number(healthForm.energyScore),
      generalHealthScore: healthForm.generalHealthScore === '' ? null : Number(healthForm.generalHealthScore),
    }),
    onSuccess: () => {
      setHealthError('')
      qc.invalidateQueries({ queryKey: ['health', rid] })
      setEditingHealthRecordId(null)
      setShowHealthModal(false)
      resetHealthForm()
    },
    onError: (err: any) => {
      const d = err?.response?.data
      setHealthError([d?.message, d?.detail].filter(Boolean).join(' ') || 'Unable to update health record.')
    }
  })
  const deleteHealth = useMutation({
    mutationFn: (healthRecordId: number) => deleteHealthRecord(rid, healthRecordId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['health', rid] })
  })
  const addEducation = useMutation({
    mutationFn: () =>
      addEducationRecord(rid, {
        recordDate: educationForm.recordDate,
        schoolName: educationSchoolNamePayload(),
        educationLevel: educationForm.educationLevel,
        enrollmentStatus: educationForm.enrollmentStatus,
        attendanceRate:
          educationForm.attendanceRate === '' ? null : Number(educationForm.attendanceRate) / 100,
        progressPercent: educationForm.progressPercent === '' ? null : Number(educationForm.progressPercent),
        completionStatus: educationForm.completionStatus,
        notes: educationForm.notes || null
      }),
    onSuccess: () => {
      setEducationError('')
      qc.invalidateQueries({ queryKey: ['education', rid] })
      setEditingEducationRecordId(null)
      setShowEducationModal(false)
      resetEducationForm()
    },
    onError: (err: any) => {
      const d = err?.response?.data
      setEducationError([d?.message, d?.detail].filter(Boolean).join(' ') || 'Unable to add education record.')
    }
  })
  const editEducation = useMutation({
    mutationFn: (educationRecordId: number) =>
      updateEducationRecord(rid, educationRecordId, {
        recordDate: educationForm.recordDate,
        schoolName: educationSchoolNamePayload(),
        educationLevel: educationForm.educationLevel,
        enrollmentStatus: educationForm.enrollmentStatus,
        attendanceRate:
          educationForm.attendanceRate === '' ? null : Number(educationForm.attendanceRate) / 100,
        progressPercent: educationForm.progressPercent === '' ? null : Number(educationForm.progressPercent),
        completionStatus: educationForm.completionStatus,
        notes: educationForm.notes || null
      }),
    onSuccess: () => {
      setEducationError('')
      qc.invalidateQueries({ queryKey: ['education', rid] })
      setEditingEducationRecordId(null)
      setShowEducationModal(false)
      resetEducationForm()
    },
    onError: (err: any) => {
      const d = err?.response?.data
      setEducationError([d?.message, d?.detail].filter(Boolean).join(' ') || 'Unable to update education record.')
    }
  })
  const deleteEducation = useMutation({
    mutationFn: (educationRecordId: number) => deleteEducationRecord(rid, educationRecordId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['education', rid] })
  })
  const updateRes = useMutation({
    mutationFn: () => updateResident(rid, {
      safehouseId: editForm.safehouseId ? +editForm.safehouseId : r?.safehouseId,
      caseControlNo: editForm.caseControlNo,
      sex: editForm.sex,
      dateOfBirth: editForm.dateOfBirth,
      birthStatus: editForm.birthStatus,
      placeOfBirth: editForm.placeOfBirth,
      religion: editForm.religion,
      currentRiskLevel: editForm.currentRiskLevel,
      initialRiskLevel: editForm.initialRiskLevel,
      caseStatus: editForm.caseStatus,
      caseCategory: editForm.caseCategory,
      reintegrationStatus: editForm.reintegrationStatus,
      reintegrationType: editForm.reintegrationType,
      dateOfAdmission: editForm.dateOfAdmission,
      referralSource: editForm.referralSource,
      referringAgencyPerson: editForm.referringAgencyPerson,
      dateColbRegistered: editForm.dateColbRegistered,
      dateColbObtained: editForm.dateColbObtained,
      assignedSocialWorker: editForm.assignedSocialWorker,
      initialCaseAssessment: editForm.initialCaseAssessment,
      dateCaseStudyPrepared: editForm.dateCaseStudyPrepared,
      dateEnrolled: editForm.dateEnrolled,
      dateClosed: editForm.dateClosed,
      subCatOrphaned: !!editForm.subCatOrphaned,
      subCatTrafficked: !!editForm.subCatTrafficked,
      subCatChildLabor: !!editForm.subCatChildLabor,
      subCatPhysicalAbuse: !!editForm.subCatPhysicalAbuse,
      subCatSexualAbuse: !!editForm.subCatSexualAbuse,
      subCatOsaec: !!editForm.subCatOsaec,
      subCatCicl: !!editForm.subCatCicl,
      subCatAtRisk: !!editForm.subCatAtRisk,
      subCatStreetChild: !!editForm.subCatStreetChild,
      subCatChildWithHiv: !!editForm.subCatChildWithHiv,
      isPwd: !!editForm.isPwd,
      pwdType: editForm.pwdType,
      hasSpecialNeeds: !!editForm.hasSpecialNeeds,
      specialNeedsDiagnosis: editForm.specialNeedsDiagnosis,
      familyIs4ps: !!editForm.familyIs4ps,
      familySoloParent: !!editForm.familySoloParent,
      familyIndigenous: !!editForm.familyIndigenous,
      familyParentPwd: !!editForm.familyParentPwd,
      familyInformalSettler: !!editForm.familyInformalSettler,
      notesRestricted: editForm.notesRestricted,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resident', rid] }); setEditMode(false) }
  })
  const deleteRes = useMutation({
    mutationFn: () => deleteResident(rid),
    onSuccess: () => {
      setDeleteError('')
      qc.invalidateQueries({ queryKey: ['residents'] })
      navigate('/admin/residents')
    }
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
  const openAddRecording = () => {
    setEditingRecordingId(null)
    resetRecForm()
    setShowRecModal(true)
  }
  const openEditRecording = (rec: RecordingRow) => {
    setEditingRecordingId(rec.recordingId)
    setRecForm({
      sessionDate: rec.sessionDate || '',
      socialWorker: rec.socialWorker || '',
      sessionType: rec.sessionType || 'Individual',
      sessionDurationMinutes: rec.sessionDurationMinutes || 60,
      emotionalStateObserved: rec.emotionalStateObserved || 'Calm',
      emotionalStateEnd: rec.emotionalStateEnd || 'Calm',
      sessionNarrative: rec.sessionNarrative || '',
      interventionsApplied: (rec.interventionsApplied || '').split(',').map(s => s.trim()).filter(Boolean),
      followUpActions: (rec.followUpActions || '').split(',').map(s => s.trim()).filter(Boolean),
      progressNoted: !!rec.progressNoted,
      concernsFlagged: !!rec.concernsFlagged,
      referralMade: !!rec.referralMade,
      notesRestricted: rec.notesRestricted || ''
    })
    setShowRecModal(true)
  }
  const openAddVisitation = () => {
    setEditingVisitationId(null)
    setVisitationError('')
    resetVisitForm()
    setShowVisitModal(true)
  }
  const openEditVisitation = (v: VisitationRow) => {
    setEditingVisitationId(v.visitationId)
    setVisitationError('')
    setVisitForm({
      visitDate: v.visitDate || '',
      visitType: v.visitType || 'Routine Follow-Up',
      socialWorker: v.socialWorker || '',
      locationVisited: v.locationVisited || '',
      familyMembersPresent: v.familyMembersPresent || '',
      purpose: v.purpose || '',
      observations: v.observations || '',
      familyCooperationLevel: v.familyCooperationLevel || 'Cooperative',
      safetyConcernsNoted: !!v.safetyConcernsNoted,
      followUpNeeded: !!v.followUpNeeded,
      followUpNotes: v.followUpNotes || '',
      visitOutcome: v.visitOutcome || ''
    })
    setShowVisitModal(true)
  }
  const openAddIntervention = () => {
    setEditingInterventionId(null)
    setInterventionError('')
    resetInterventionForm()
    setShowInterventionModal(true)
  }
  const openAddHealth = () => {
    setEditingHealthRecordId(null)
    setHealthError('')
    resetHealthForm()
    setShowHealthModal(true)
  }
  const openEditHealth = (h: HealthRow) => {
    setEditingHealthRecordId(h.healthRecordId)
    setHealthError('')
    setHealthForm({
      recordDate: h.recordDate || '',
      weightKg: h.weightKg != null ? String(h.weightKg) : '',
      heightCm: h.heightCm != null ? String(h.heightCm) : '',
      bmi: h.bmi != null ? String(h.bmi) : '',
      nutritionScore: h.nutritionScore != null ? String(h.nutritionScore) : '',
      sleepScore: h.sleepQualityScore != null ? String(h.sleepQualityScore) : '',
      energyScore: h.energyLevelScore != null ? String(h.energyLevelScore) : '',
      generalHealthScore: h.generalHealthScore != null ? String(h.generalHealthScore) : '',
      medicalCheckupDone: !!h.medicalCheckupDone,
      dentalCheckupDone: !!h.dentalCheckupDone,
      psychologicalCheckupDone: !!h.psychologicalCheckupDone,
      medicalNotesRestricted: h.notes || ''
    })
    setShowHealthModal(true)
  }
  const openAddEducation = () => {
    setEditingEducationRecordId(null)
    setEducationError('')
    resetEducationForm()
    setShowEducationModal(true)
  }
  const openEditEducation = (e: EducationRow) => {
    setEditingEducationRecordId(e.educationRecordId)
    setEducationError('')
    const school = (e.schoolName || '').trim()
    const pick = school && EDUCATION_SCHOOL_OPTIONS.includes(school) ? school : EDUCATION_SCHOOL_OTHER
    setEducationForm({
      recordDate: e.recordDate || '',
      schoolPick: pick,
      schoolCustom: pick === EDUCATION_SCHOOL_OTHER ? school : '',
      educationLevel: (EDUCATION_LEVEL_OPTIONS as readonly string[]).includes(e.educationLevel || '')
        ? (e.educationLevel as (typeof EDUCATION_LEVEL_OPTIONS)[number])
        : 'Primary',
      enrollmentStatus: (EDUCATION_ENROLLMENT_OPTIONS as readonly string[]).includes(e.enrollmentStatus || '')
        ? (e.enrollmentStatus as (typeof EDUCATION_ENROLLMENT_OPTIONS)[number])
        : 'Enrolled',
      attendanceRate:
        e.attendanceRate != null ? String(Math.round(e.attendanceRate * 10000) / 100) : '',
      progressPercent: e.progressPercent != null ? String(e.progressPercent) : '',
      completionStatus: (EDUCATION_COMPLETION_OPTIONS as readonly string[]).includes(e.completionStatus || '')
        ? (e.completionStatus as (typeof EDUCATION_COMPLETION_OPTIONS)[number])
        : 'NotStarted',
      notes: e.notes || ''
    })
    setShowEducationModal(true)
  }
  const openEditIntervention = (p: InterventionRow) => {
    setEditingInterventionId(p.planId)
    setInterventionError('')
    setInterventionForm({
      planCategory: p.planCategory || 'Safety',
      planDescription: p.planDescription || '',
      servicesProvided: (p.servicesProvided || '').split(',').map(s => s.trim()).filter(Boolean),
      targetValue: p.targetValue != null ? String(p.targetValue) : '',
      targetDate: p.targetDate || '',
      status: p.status || 'Open',
      caseConferenceDate: p.caseConferenceDate || ''
    })
    setShowInterventionModal(true)
  }

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
            ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                  setEditMode(true)
                  setEditForm({
                  caseControlNo: resident.caseControlNo ?? '',
                  safehouseId: resident.safehouseId?.toString() ?? '',
                  sex: resident.sex ?? 'F',
                  dateOfBirth: resident.dateOfBirth ?? '',
                  birthStatus: resident.birthStatus ?? 'Non-Marital',
                  placeOfBirth: resident.placeOfBirth ?? '',
                  religion: resident.religion ?? '',
                  caseCategory: resident.caseCategory ?? 'Neglected',
                  dateOfAdmission: resident.dateOfAdmission ?? '',
                  referralSource: resident.referralSource ?? 'Government Agency',
                  referringAgencyPerson: resident.referringAgencyPerson ?? '',
                  dateColbRegistered: resident.dateColbRegistered ?? '',
                  dateColbObtained: resident.dateColbObtained ?? '',
                  currentRiskLevel: resident.currentRiskLevel ?? 'Medium',
                  initialRiskLevel: resident.initialRiskLevel ?? 'Medium',
                  caseStatus: resident.caseStatus ?? 'Active',
                  reintegrationStatus: resident.reintegrationStatus ?? 'Not Started',
                  reintegrationType: resident.reintegrationType ?? 'None',
                  assignedSocialWorker: resident.assignedSocialWorker ?? '',
                  initialCaseAssessment: resident.initialCaseAssessment ?? '',
                  dateCaseStudyPrepared: resident.dateCaseStudyPrepared ?? '',
                  dateEnrolled: resident.dateEnrolled ?? '',
                  dateClosed: resident.dateClosed ?? '',
                  subCatOrphaned: !!resident.subCatOrphaned,
                  subCatTrafficked: !!resident.subCatTrafficked,
                  subCatChildLabor: !!resident.subCatChildLabor,
                  subCatPhysicalAbuse: !!resident.subCatPhysicalAbuse,
                  subCatSexualAbuse: !!resident.subCatSexualAbuse,
                  subCatOsaec: !!resident.subCatOsaec,
                  subCatCicl: !!resident.subCatCicl,
                  subCatAtRisk: !!resident.subCatAtRisk,
                  subCatStreetChild: !!resident.subCatStreetChild,
                  subCatChildWithHiv: !!resident.subCatChildWithHiv,
                  isPwd: !!resident.isPwd,
                  pwdType: resident.pwdType ?? '',
                  hasSpecialNeeds: !!resident.hasSpecialNeeds,
                  specialNeedsDiagnosis: resident.specialNeedsDiagnosis ?? '',
                  familyIs4ps: !!resident.familyIs4ps,
                  familySoloParent: !!resident.familySoloParent,
                  familyIndigenous: !!resident.familyIndigenous,
                  familyParentPwd: !!resident.familyParentPwd,
                  familyInformalSettler: !!resident.familyInformalSettler,
                  notesRestricted: resident.notesRestricted ?? ''
                })
                }}>Edit</button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setDeleteError('')
                    setConfirmDelete({ kind: 'resident' })
                  }}
                  disabled={deleteRes.isPending}
                >
                  {deleteRes.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            : <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => updateRes.mutate()}>Save</button>
              </div>
          }
        </div>
      </div>
      {deleteError && (
        <div style={{ marginBottom: 16, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
          {deleteError}
        </div>
      )}

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
                <div className="form-group"><label>Case Control No.</label><input value={editForm.caseControlNo} onChange={e => setEditForm(p => ({ ...p, caseControlNo: e.target.value }))} /></div>
                <div className="form-group"><label>Risk Level</label>
                  <select value={editForm.currentRiskLevel} onChange={e => setEditForm(p => ({ ...p, currentRiskLevel: e.target.value }))}>
                    {['Low', 'Medium', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Initial Risk Level</label>
                  <select value={editForm.initialRiskLevel} onChange={e => setEditForm(p => ({ ...p, initialRiskLevel: e.target.value }))}>
                    {['Low', 'Medium', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Case Status</label>
                  <select value={editForm.caseStatus} onChange={e => setEditForm(p => ({ ...p, caseStatus: e.target.value }))}>
                    {['Active', 'Closed', 'Transferred'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Case Category</label><select value={editForm.caseCategory} onChange={e => setEditForm(p => ({ ...p, caseCategory: e.target.value }))}>{['Abandoned', 'Foundling', 'Surrendered', 'Neglected'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="form-group"><label>Sex</label><input value={editForm.sex} onChange={e => setEditForm(p => ({ ...p, sex: e.target.value }))} /></div>
                <div className="form-group"><label>Date of Birth</label><input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm(p => ({ ...p, dateOfBirth: e.target.value }))} /></div>
                <div className="form-group"><label>Birth Status</label><select value={editForm.birthStatus} onChange={e => setEditForm(p => ({ ...p, birthStatus: e.target.value }))}>{['Marital', 'Non-Marital'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="form-group"><label>Place of Birth</label><input value={editForm.placeOfBirth} onChange={e => setEditForm(p => ({ ...p, placeOfBirth: e.target.value }))} /></div>
                <div className="form-group"><label>Religion</label>
                  <select value={editForm.religion} onChange={e => setEditForm(p => ({ ...p, religion: e.target.value }))}>
                    <option value="">Select religion</option>
                    {RELIGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Reintegration Status</label>
                  <select value={editForm.reintegrationStatus} onChange={e => setEditForm(p => ({ ...p, reintegrationStatus: e.target.value }))}>
                    {['Not Started', 'In Progress', 'Completed', 'On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Reintegration Type</label><select value={editForm.reintegrationType} onChange={e => setEditForm(p => ({ ...p, reintegrationType: e.target.value }))}>{['Family Reunification', 'Foster Care', 'Adoption (Domestic)', 'Adoption (Inter-Country)', 'Independent Living', 'None'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="form-group"><label>Safehouse</label>
                  <select value={editForm.safehouseId} onChange={e => setEditForm(p => ({ ...p, safehouseId: e.target.value }))}>
                    <option value="">None</option>
                    {(safehouses ?? []).map((s: SafehouseRow) => <option key={s.safehouseId} value={s.safehouseId}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Date of Admission</label><input type="date" value={editForm.dateOfAdmission} onChange={e => setEditForm(p => ({ ...p, dateOfAdmission: e.target.value }))} /></div>
                <div className="form-group"><label>Date Enrolled</label><input type="date" value={editForm.dateEnrolled} onChange={e => setEditForm(p => ({ ...p, dateEnrolled: e.target.value }))} /></div>
                <div className="form-group"><label>Date Closed</label><input type="date" value={editForm.dateClosed} onChange={e => setEditForm(p => ({ ...p, dateClosed: e.target.value }))} /></div>
                <div className="form-group"><label>Referral Source</label><select value={editForm.referralSource} onChange={e => setEditForm(p => ({ ...p, referralSource: e.target.value }))}>{['Government Agency', 'NGO', 'Police', 'Self-Referral', 'Community', 'Court Order'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="form-group"><label>Referring Agency/Person</label><input value={editForm.referringAgencyPerson} onChange={e => setEditForm(p => ({ ...p, referringAgencyPerson: e.target.value }))} /></div>
                <div className="form-group"><label>COLB Registered</label><input type="date" value={editForm.dateColbRegistered} onChange={e => setEditForm(p => ({ ...p, dateColbRegistered: e.target.value }))} /></div>
                <div className="form-group"><label>COLB Obtained</label><input type="date" value={editForm.dateColbObtained} onChange={e => setEditForm(p => ({ ...p, dateColbObtained: e.target.value }))} /></div>
                <div className="form-group"><label>Assigned Social Worker</label>
                  <input value={editForm.assignedSocialWorker} onChange={e => setEditForm(p => ({ ...p, assignedSocialWorker: e.target.value }))} placeholder="SW-00" />
                </div>
                <div className="form-group"><label>Case Study Prepared</label><input type="date" value={editForm.dateCaseStudyPrepared} onChange={e => setEditForm(p => ({ ...p, dateCaseStudyPrepared: e.target.value }))} /></div>
                <div className="form-group"><label>PWD Type</label><input value={editForm.pwdType} onChange={e => setEditForm(p => ({ ...p, pwdType: e.target.value }))} /></div>
                <div className="form-group"><label>Special Needs Diagnosis</label><input value={editForm.specialNeedsDiagnosis} onChange={e => setEditForm(p => ({ ...p, specialNeedsDiagnosis: e.target.value }))} /></div>
                <div className="form-group">
                  <label>Initial Case Assessment</label>
                  <select value={editForm.initialCaseAssessment} onChange={e => setEditForm(p => ({ ...p, initialCaseAssessment: e.target.value }))}>
                    <option value="">Select assessment</option>
                    {INITIAL_CASE_ASSESSMENT_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Restricted Notes</label><textarea rows={2} value={editForm.notesRestricted} onChange={e => setEditForm(p => ({ ...p, notesRestricted: e.target.value }))} /></div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                  {[
                    ['subCatOrphaned', 'Orphaned'], ['subCatTrafficked', 'Trafficked'], ['subCatChildLabor', 'Child Labor'],
                    ['subCatPhysicalAbuse', 'Physical Abuse'], ['subCatSexualAbuse', 'Sexual Abuse'], ['subCatOsaec', 'OSAEC/CSAEM'],
                    ['subCatCicl', 'CICL'], ['subCatAtRisk', 'At Risk'], ['subCatStreetChild', 'Street Child'], ['subCatChildWithHiv', 'Child with HIV'],
                    ['isPwd', 'Resident is PWD'], ['hasSpecialNeeds', 'Has Special Needs'], ['familyIs4ps', 'Family is 4Ps'],
                    ['familySoloParent', 'Family Solo Parent'], ['familyIndigenous', 'Family Indigenous'], ['familyParentPwd', 'Family Parent PWD'],
                    ['familyInformalSettler', 'Family Informal Settler']
                  ].map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                      <input type="checkbox" checked={!!editForm[key]} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Case Control No.', resident.caseControlNo || '—'],
                  ['Internal Code', resident.internalCode || '—'],
                  ['Safehouse', sh?.name || resident.safehouses?.name || '—'],
                  ['Case Status', resident.caseStatus || '—'],
                  ['Case Category', resident.caseCategory || '—'],
                  ['Sex', resident.sex || '—'],
                  ['Date of Birth', resident.dateOfBirth || '—'],
                  ['Birth Status', resident.birthStatus || '—'],
                  ['Place of Birth', resident.placeOfBirth || '—'],
                  ['Religion', resident.religion || '—'],
                  ['Date of Admission', resident.dateOfAdmission || '—'],
                  ['Age Upon Admission', resident.ageUponAdmission || '—'],
                  ['Present Age', resident.presentAge || '—'],
                  ['Length of Stay', resident.lengthOfStay || '—'],
                  ['Date Enrolled', resident.dateEnrolled || '—'],
                  ['Date Closed', resident.dateClosed || '—'],
                  ['Referral Source', resident.referralSource || '—'],
                  ['Referring Agency/Person', resident.referringAgencyPerson || '—'],
                  ['COLB Registered', resident.dateColbRegistered || '—'],
                  ['COLB Obtained', resident.dateColbObtained || '—'],
                  ['Assigned Social Worker', resident.assignedSocialWorker || '—'],
                  ['Initial Case Assessment', resident.initialCaseAssessment || '—'],
                  ['Case Study Prepared', resident.dateCaseStudyPrepared || '—'],
                  ['Initial Risk Level', resident.initialRiskLevel || '—'],
                  ['Current Risk Level', resident.currentRiskLevel || '—'],
                  ['Reintegration Type', resident.reintegrationType || '—'],
                  ['Reintegration Status', resident.reintegrationStatus || 'Not Started'],
                  ['PWD', resident.isPwd ? 'Yes' : 'No'],
                  ['PWD Type', resident.pwdType || '—'],
                  ['Has Special Needs', resident.hasSpecialNeeds ? 'Yes' : 'No'],
                  ['Special Needs Diagnosis', resident.specialNeedsDiagnosis || '—'],
                  ['Family is 4Ps', resident.familyIs4ps ? 'Yes' : 'No'],
                  ['Family Solo Parent', resident.familySoloParent ? 'Yes' : 'No'],
                  ['Family Indigenous', resident.familyIndigenous ? 'Yes' : 'No'],
                  ['Family Parent PWD', resident.familyParentPwd ? 'Yes' : 'No'],
                  ['Family Informal Settler', resident.familyInformalSettler ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {[
                    ['Orphaned', resident.subCatOrphaned],
                    ['Trafficked', resident.subCatTrafficked],
                    ['Child Labor', resident.subCatChildLabor],
                    ['Physical Abuse', resident.subCatPhysicalAbuse],
                    ['Sexual Abuse', resident.subCatSexualAbuse],
                    ['OSAEC/CSAEM', resident.subCatOsaec],
                    ['CICL', resident.subCatCicl],
                    ['At Risk', resident.subCatAtRisk],
                    ['Street Child', resident.subCatStreetChild],
                    ['Child with HIV', resident.subCatChildWithHiv],
                  ].filter(([, val]) => !!val).map(([label]) => (
                    <span key={label as string} className="badge badge-orange">{label as string}</span>
                  ))}
                </div>
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
            <button className="btn btn-primary" onClick={openAddRecording}><Plus size={15} /> Add Recording</button>
          </div>
          {(recordings ?? []).length === 0
            ? <div className="empty-state"><h3>No process recordings yet</h3></div>
            : (recordings ?? []).map((rec: RecordingRow) => (
              <div key={rec.recordingId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{rec.sessionDate}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {rec.socialWorker} · {rec.sessionType} · {rec.sessionDurationMinutes ? `${rec.sessionDurationMinutes} min` : '—'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditRecording(rec)}>Edit</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setConfirmDelete({ kind: 'recording', recordingId: rec.recordingId })
                          }}
                          disabled={deleteRec.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      {rec.emotionalStateObserved && <span className="badge badge-blue">{rec.emotionalStateObserved}</span>}
                      {rec.progressNoted && <span className="badge badge-green">Progress</span>}
                      {rec.concernsFlagged && <span className="badge badge-red">Concern</span>}
                    </div>
                  </div>
                </div>
                {rec.sessionNarrative && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{rec.sessionNarrative}</p>}
                {rec.interventionsApplied && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}><strong>Interventions:</strong> {rec.interventionsApplied}</p>}
                {rec.followUpActions && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}><strong>Follow-up:</strong> {rec.followUpActions}</p>}
              </div>
            ))
          }
            {showRecModal && (
    <div className="modal-overlay" onClick={() => { setShowRecModal(false); setEditingRecordingId(null); resetRecForm() }}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 860, width: '100%' }}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: '1px solid var(--border)'
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>{editingRecordingId ? 'Edit Process Recording' : 'Add Process Recording'}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Record the counseling session details, observations, and follow-up actions.
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowRecModal(false); setEditingRecordingId(null); resetRecForm() }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Session Details */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              background: '#fcfcfc'
            }}
          >
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Session Details</h3>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label>Session Date</label>
                <input
                  type="date"
                  value={recForm.sessionDate}
                  onChange={e => setRecForm(p => ({ ...p, sessionDate: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Social Worker</label>
                <input
                  value={recForm.socialWorker}
                  onChange={e => setRecForm(p => ({ ...p, socialWorker: e.target.value }))}
                  placeholder="SW-00"
                />
              </div>

              <div className="form-group">
                <label>Session Type</label>
                <select
                  value={recForm.sessionType}
                  onChange={e => setRecForm(p => ({ ...p, sessionType: e.target.value }))}
                >
                  {['Individual', 'Group'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Session Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={recForm.sessionDurationMinutes}
                  onChange={e =>
                    setRecForm(p => ({
                      ...p,
                      sessionDurationMinutes: Number(e.target.value || 0)
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Emotional State */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              background: '#fcfcfc'
            }}
          >
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Emotional State</h3>
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label>Emotional State at Start</label>
                <select
                  value={recForm.emotionalStateObserved}
                  onChange={e => setRecForm(p => ({ ...p, emotionalStateObserved: e.target.value }))}
                >
                  {['Calm', 'Anxious', 'Sad', 'Angry', 'Hopeful', 'Withdrawn', 'Happy', 'Distressed'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Emotional State at End</label>
                <select
                  value={recForm.emotionalStateEnd}
                  onChange={e => setRecForm(p => ({ ...p, emotionalStateEnd: e.target.value }))}
                >
                  {['Calm', 'Anxious', 'Sad', 'Angry', 'Hopeful', 'Withdrawn', 'Happy', 'Distressed'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interventions */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              background: '#fcfcfc'
            }}
          >
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Interventions Applied</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 10
              }}
            >
              {INTERVENTIONS_APPLIED_OPTIONS.map(v => (
                <label
                  key={v}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: 'var(--surface-1)', color: 'var(--text)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={recForm.interventionsApplied.includes(v)}
                    onChange={e =>
                      setRecForm(p => ({
                        ...p,
                        interventionsApplied: e.target.checked
                          ? [...p.interventionsApplied, v]
                          : p.interventionsApplied.filter(x => x !== v)
                      }))
                    }
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Narrative */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              background: '#fcfcfc'
            }}
          >
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Session Notes</h3>

            <div className="form-group">
              <label>Session Narrative</label>
              <textarea
                rows={5}
                value={recForm.sessionNarrative}
                onChange={e => setRecForm(p => ({ ...p, sessionNarrative: e.target.value }))}
                style={{ resize: 'vertical' }}
                placeholder="Summarize what happened during the session, key observations, and resident response..."
              />
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Restricted Notes</label>
              <textarea
                rows={3}
                value={recForm.notesRestricted}
                onChange={e => setRecForm(p => ({ ...p, notesRestricted: e.target.value }))}
                style={{ resize: 'vertical' }}
                placeholder="Add confidential or restricted notes here..."
              />
            </div>
          </div>

          {/* Follow-up */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              background: '#fcfcfc'
            }}
          >
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Follow-up Actions</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 10
              }}
            >
              {FOLLOW_UP_ACTION_OPTIONS.map(v => (
                <label
                  key={v}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: 'var(--surface-1)', color: 'var(--text)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={recForm.followUpActions.includes(v)}
                    onChange={e =>
                      setRecForm(p => ({
                        ...p,
                        followUpActions: e.target.checked
                          ? [...p.followUpActions, v]
                          : p.followUpActions.filter(x => x !== v)
                      }))
                    }
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              background: '#fcfcfc'
            }}
          >
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Session Flags</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                ['progressNoted', 'Progress Noted'],
                ['concernsFlagged', 'Concerns Flagged'],
                ['referralMade', 'Referral Made']
              ].map(([key, label]) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: 13,
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    borderRadius: 999,
                    padding: '8px 12px',
                    background: 'var(--surface-1)', color: 'var(--text)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={recForm[key as keyof typeof recForm] as boolean}
                    onChange={e => setRecForm(p => ({ ...p, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--border)'
          }}
        >
          <button className="btn btn-ghost" onClick={() => { setShowRecModal(false); setEditingRecordingId(null); resetRecForm() }}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => editingRecordingId ? editRec.mutate(editingRecordingId) : addRec.mutate()}
            disabled={addRec.isPending || editRec.isPending}
          >
            {(addRec.isPending || editRec.isPending) ? 'Saving...' : (editingRecordingId ? 'Update Recording' : 'Save Recording')}
          </button>
        </div>
      </div>
    </div>
  )}    
        </div>
      )}

      {tab === 'visitations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openAddVisitation}><Plus size={15} /> Log Visitation</button>
          </div>
          {(visitations ?? []).length === 0
            ? <div className="empty-state"><h3>No visitations recorded yet</h3></div>
            : (visitations ?? []).map((v: VisitationRow) => (
              <div key={v.visitationId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{v.visitDate}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{v.visitType} · {v.socialWorker}</div>
                        {v.locationVisited && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {v.locationVisited}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditVisitation(v)}>Edit</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmDelete({ kind: 'visitation', visitationId: v.visitationId })}
                          disabled={deleteVisit.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <span className={`badge ${v.familyCooperationLevel === 'Highly Cooperative' || v.familyCooperationLevel === 'Cooperative' ? 'badge-green' : v.familyCooperationLevel === 'Uncooperative' ? 'badge-red' : 'badge-yellow'}`}>{v.familyCooperationLevel}</span>
                      {v.safetyConcernsNoted && <span className="badge badge-red"><AlertTriangle size={12} /> Safety</span>}
                      {v.followUpNeeded && <span className="badge badge-blue">Follow-up Needed</span>}
                      {v.visitOutcome && <span className={`badge ${v.visitOutcome === 'Favorable' ? 'badge-green' : v.visitOutcome === 'Needs Improvement' ? 'badge-yellow' : v.visitOutcome === 'Unfavorable' ? 'badge-red' : 'badge-gray'}`}>{v.visitOutcome}</span>}
                    </div>
                  </div>
                </div>
                {v.familyMembersPresent && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}><strong>Family Members Present:</strong> {v.familyMembersPresent}</p>}
                {v.purpose && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}><strong>Purpose:</strong> {v.purpose}</p>}
                {v.observations && <p style={{ fontSize: 14, marginTop: 8 }}>{v.observations}</p>}
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}><strong>Safety Concerns Noted:</strong> {v.safetyConcernsNoted ? 'Yes' : 'No'}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}><strong>Follow-up Needed:</strong> {v.followUpNeeded ? 'Yes' : 'No'}</p>
                {v.followUpNotes && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}><strong>Follow-up Notes:</strong> {v.followUpNotes}</p>}
              </div>
            ))
          }
          {showVisitModal && (
            <div className="modal-overlay" onClick={() => { setShowVisitModal(false); setEditingVisitationId(null); setVisitationError(''); resetVisitForm() }}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>{editingVisitationId ? 'Edit Home Visitation' : 'Log Home Visitation'}</h2><button className="btn btn-ghost btn-sm" onClick={() => { setShowVisitModal(false); setEditingVisitationId(null); setVisitationError(''); resetVisitForm() }}>✕</button></div>
                <div className="grid-2">
                  <div className="form-group"><label>Visit Date</label><input type="date" value={visitForm.visitDate} onChange={e => setVisitForm(p => ({ ...p, visitDate: e.target.value }))} /></div>
                  <div className="form-group"><label>Social Worker</label><input value={visitForm.socialWorker} onChange={e => setVisitForm(p => ({ ...p, socialWorker: e.target.value }))} /></div>
                  <div className="form-group"><label>Visit Type</label>
                    <select value={visitForm.visitType} onChange={e => setVisitForm(p => ({ ...p, visitType: e.target.value }))}>
                      {!VISIT_TYPE_OPTIONS.includes(visitForm.visitType) && visitForm.visitType && <option value={visitForm.visitType}>{visitForm.visitType}</option>}
                      {VISIT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Family Cooperation</label>
                    <select value={visitForm.familyCooperationLevel} onChange={e => setVisitForm(p => ({ ...p, familyCooperationLevel: e.target.value }))}>
                      {['Highly Cooperative', 'Cooperative', 'Neutral', 'Uncooperative'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Location Visited</label>
                    <select value={visitForm.locationVisited} onChange={e => setVisitForm(p => ({ ...p, locationVisited: e.target.value }))}>
                      <option value="">Select location</option>
                      {!VISIT_LOCATION_OPTIONS.includes(visitForm.locationVisited) && visitForm.locationVisited && <option value={visitForm.locationVisited}>{visitForm.locationVisited}</option>}
                      {VISIT_LOCATION_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Family Members Present</label><input value={visitForm.familyMembersPresent} onChange={e => setVisitForm(p => ({ ...p, familyMembersPresent: e.target.value }))} placeholder="None, Maria (Mother)" /></div>
                </div>
                <div className="form-group"><label>Purpose</label>
                  <select value={visitForm.purpose} onChange={e => setVisitForm(p => ({ ...p, purpose: e.target.value }))}>
                    <option value="">Select purpose</option>
                    {!VISIT_PURPOSE_OPTIONS.includes(visitForm.purpose) && visitForm.purpose && <option value={visitForm.purpose}>{visitForm.purpose}</option>}
                    {VISIT_PURPOSE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Observations</label>
                  <select value={visitForm.observations} onChange={e => setVisitForm(p => ({ ...p, observations: e.target.value }))}>
                    <option value="">Select observations</option>
                    {!VISIT_OBSERVATION_OPTIONS.includes(visitForm.observations) && visitForm.observations && <option value={visitForm.observations}>{visitForm.observations}</option>}
                    {VISIT_OBSERVATION_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Visit Outcome</label>
                  <select value={visitForm.visitOutcome} onChange={e => setVisitForm(p => ({ ...p, visitOutcome: e.target.value }))}>
                    <option value="">Select outcome</option>
                    {['Favorable', 'Needs Improvement', 'Unfavorable', 'Inconclusive'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
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
                {visitationError && (
                  <div style={{ marginBottom: 12, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                    {visitationError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => { setShowVisitModal(false); setEditingVisitationId(null); setVisitationError(''); resetVisitForm() }}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => editingVisitationId ? editVisit.mutate(editingVisitationId) : addVisit.mutate()} disabled={addVisit.isPending || editVisit.isPending}>{(addVisit.isPending || editVisit.isPending) ? 'Saving...' : (editingVisitationId ? 'Update Visitation' : 'Save')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'interventions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openAddIntervention}><Plus size={15} /> Add Intervention Plan</button>
          </div>
          {(interventionPlans ?? []).length === 0
            ? <div className="empty-state"><h3>No intervention plans yet</h3></div>
            : (interventionPlans ?? []).map((p: InterventionRow) => (
                <div key={p.planId} className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.planCategory || '—'}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Target Date: {p.targetDate || '—'} · Case Conference: {p.caseConferenceDate || '—'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditIntervention(p)}>Edit</button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirmDelete({ kind: 'intervention', planId: p.planId })}
                            disabled={deletePlan.isPending}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <span className={`badge ${
                          p.status === 'Achieved' ? 'badge-green'
                            : p.status === 'In Progress' ? 'badge-blue'
                            : p.status === 'On Hold' ? 'badge-yellow'
                            : p.status === 'Open' ? 'badge-gray'
                            : 'badge-gray'
                        }`}>
                          {p.status || '—'}
                        </span>
                        <span className="badge badge-purple">Target Value: {p.targetValue ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                  {p.planDescription && <p style={{ fontSize: 14, marginTop: 8 }}>{p.planDescription}</p>}
                  {p.servicesProvided && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}><strong>Services Provided:</strong> {p.servicesProvided}</p>}
                </div>
              ))
          }

{showInterventionModal && (
  <div
    className="modal-overlay"
    onClick={() => {
      setShowInterventionModal(false)
      setEditingInterventionId(null)
      resetInterventionForm()
    }}
  >
    <div
      className="modal"
      onClick={e => e.stopPropagation()}
      style={{ maxWidth: 860, width: '100%' }}
    >
      <div
        className="modal-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            {editingInterventionId ? 'Edit Intervention Plan' : 'Add Intervention Plan'}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Define the intervention area, services provided, goals, and important review dates.
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setShowInterventionModal(false)
            setEditingInterventionId(null)
            setInterventionError('')
            resetInterventionForm()
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Plan Details */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            background: '#fcfcfc'
          }}
        >
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Plan Details</h3>
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label>Plan Category</label>
              <select
                value={interventionForm.planCategory}
                onChange={e =>
                  setInterventionForm(p => ({ ...p, planCategory: e.target.value }))
                }
              >
                {['Safety', 'Psychosocial', 'Education', 'Physical Health', 'Legal', 'Reintegration'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={interventionForm.status}
                onChange={e =>
                  setInterventionForm(p => ({ ...p, status: e.target.value }))
                }
              >
                {['Open', 'In Progress', 'Achieved', 'On Hold', 'Closed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target Value</label>
              <input
                type="number"
                step="0.01"
                value={interventionForm.targetValue}
                onChange={e =>
                  setInterventionForm(p => ({ ...p, targetValue: e.target.value }))
                }
                placeholder="Enter numeric goal or target"
              />
            </div>

            <div className="form-group">
              <label>Target Date</label>
              <input
                type="date"
                value={interventionForm.targetDate}
                onChange={e =>
                  setInterventionForm(p => ({ ...p, targetDate: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* Services Provided */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            background: '#fcfcfc'
          }}
        >
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Services Provided</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10
            }}
          >
            {INTERVENTIONS_APPLIED_OPTIONS.map(v => (
              <label
                key={v}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  background: 'var(--surface-1)', color: 'var(--text)',
                }}
              >
                <input
                  type="checkbox"
                  checked={interventionForm.servicesProvided.includes(v)}
                  onChange={e =>
                    setInterventionForm(p => ({
                      ...p,
                      servicesProvided: e.target.checked
                        ? [...p.servicesProvided, v]
                        : p.servicesProvided.filter(x => x !== v)
                    }))
                  }
                />
                {v}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            background: '#fcfcfc'
          }}
        >
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Plan Description</h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Description</label>
            <textarea
              rows={5}
              value={interventionForm.planDescription}
              onChange={e =>
                setInterventionForm(p => ({ ...p, planDescription: e.target.value }))
              }
              style={{ resize: 'vertical' }}
              placeholder="Describe the intervention goals, approach, and expected outcomes..."
            />
          </div>
        </div>

        {/* Review Dates */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            background: '#fcfcfc'
          }}
        >
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Review & Follow-up</h3>
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label>Case Conference Date</label>
              <input
                type="date"
                value={interventionForm.caseConferenceDate}
                onChange={e =>
                  setInterventionForm(p => ({
                    ...p,
                    caseConferenceDate: e.target.value
                  }))
                }
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'end',
                fontSize: 13,
                color: 'var(--text-muted)',
                paddingBottom: 10
              }}
            >
              Use this section to capture when the intervention plan should be formally reviewed.
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid var(--border)'
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => {
            setShowInterventionModal(false)
            setEditingInterventionId(null)
            setInterventionError('')
            resetInterventionForm()
          }}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={() =>
            editingInterventionId
              ? editPlan.mutate(editingInterventionId)
              : addPlan.mutate()
          }
          disabled={addPlan.isPending || editPlan.isPending}
        >
          {(addPlan.isPending || editPlan.isPending)
            ? 'Saving...'
            : editingInterventionId
              ? 'Update Plan'
              : 'Save Plan'}
        </button>
      </div>

      {interventionError && (
        <div style={{ marginBottom: 12, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
          {interventionError}
        </div>
      )}
    </div>
  </div>
)}
        </div>
      )}

      {tab === 'health' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openAddHealth}><Plus size={15} /> Add Health Record</button>
          </div>
          {(healthRecords ?? []).length === 0
            ? <div className="empty-state"><h3>No health records yet</h3></div>
            : (healthRecords ?? []).map((h: HealthRow) => (
              <div key={h.healthRecordId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600 }}>{h.recordDate}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditHealth(h)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ kind: 'health', healthRecordId: h.healthRecordId })} disabled={deleteHealth.isPending}>Delete</button>
                  </div>
                </div>
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
                    General Health Score: <strong>{h.generalHealthScore}/5</strong>
                    {h.nutritionScore && <> · Nutrition: <strong>{h.nutritionScore}/5</strong></>}
                    {h.sleepQualityScore != null && <> · Sleep: <strong>{h.sleepQualityScore}/5</strong></>}
                    {h.energyLevelScore != null && <> · Energy: <strong>{h.energyLevelScore}/5</strong></>}
                  </div>
                )}
                {h.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}><strong>Notes:</strong> {h.notes}</p>}
              </div>
            ))
          }

          {showHealthModal && (
            <div className="modal-overlay" onClick={() => { setShowHealthModal(false); setEditingHealthRecordId(null); setHealthError(''); resetHealthForm() }}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>{editingHealthRecordId ? 'Edit Health Record' : 'Add Health Record'}</h2><button className="btn btn-ghost btn-sm" onClick={() => { setShowHealthModal(false); setEditingHealthRecordId(null); setHealthError(''); resetHealthForm() }}>✕</button></div>
                <div className="grid-2">
                  <div className="form-group"><label>Record Date</label><input type="date" value={healthForm.recordDate} onChange={e => setHealthForm(p => ({ ...p, recordDate: e.target.value }))} /></div>
                  <div className="form-group"><label>Weight (kg)</label><input type="number" step="0.1" value={healthForm.weightKg} onChange={e => setHealthForm(p => ({ ...p, weightKg: e.target.value }))} /></div>
                  <div className="form-group"><label>Height (cm)</label><input type="number" step="0.1" value={healthForm.heightCm} onChange={e => setHealthForm(p => ({ ...p, heightCm: e.target.value }))} /></div>
                  <div className="form-group"><label>BMI</label><input type="number" step="0.1" value={healthForm.bmi} onChange={e => setHealthForm(p => ({ ...p, bmi: e.target.value }))} /></div>
                  <div className="form-group"><label>Nutrition Score (1.0-5.0)</label><input type="number" step="0.01" min={1} max={5} value={healthForm.nutritionScore} onChange={e => setHealthForm(p => ({ ...p, nutritionScore: e.target.value }))} /></div>
                  <div className="form-group"><label>Sleep Score (1.0-5.0)</label><input type="number" step="0.01" min={1} max={5} value={healthForm.sleepScore} onChange={e => setHealthForm(p => ({ ...p, sleepScore: e.target.value }))} /></div>
                  <div className="form-group"><label>Energy Score (1.0-5.0)</label><input type="number" step="0.01" min={1} max={5} value={healthForm.energyScore} onChange={e => setHealthForm(p => ({ ...p, energyScore: e.target.value }))} /></div>
                  <div className="form-group"><label>General Health Score (1.0-5.0)</label><input type="number" step="0.01" min={1} max={5} value={healthForm.generalHealthScore} onChange={e => setHealthForm(p => ({ ...p, generalHealthScore: e.target.value }))} /></div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  {[['medicalCheckupDone', 'Medical Check-up Done'], ['dentalCheckupDone', 'Dental Check-up Done'], ['psychologicalCheckupDone', 'Psychological Check-up Done']].map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={healthForm[key as keyof typeof healthForm] as boolean}
                        onChange={e => setHealthForm(p => ({ ...p, [key]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="form-group"><label>Medical Notes (Restricted)</label><textarea rows={3} value={healthForm.medicalNotesRestricted} onChange={e => setHealthForm(p => ({ ...p, medicalNotesRestricted: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                {healthError && (
                  <div style={{ marginBottom: 12, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                    {healthError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => { setShowHealthModal(false); setEditingHealthRecordId(null); setHealthError(''); resetHealthForm() }}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => editingHealthRecordId ? editHealth.mutate(editingHealthRecordId) : addHealth.mutate()} disabled={addHealth.isPending || editHealth.isPending}>{(addHealth.isPending || editHealth.isPending) ? 'Saving...' : (editingHealthRecordId ? 'Update Record' : 'Save Record')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'education' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openAddEducation}><Plus size={15} /> Add Education Record</button>
          </div>
          {(educationRecords ?? []).length === 0
            ? <div className="empty-state"><h3>No education records yet</h3><p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Add a monthly education snapshot for this resident.</p></div>
            : (educationRecords ?? []).map((e: EducationRow) => (
              <div key={e.educationRecordId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 17 }}>{e.schoolName || 'School'}</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 4
                      }}
                    >
                      <span>{e.educationLevel || '—'} · {e.recordDate}</span>
                      {e.enrollmentStatus && (
                        <span className="badge badge-blue" style={{ verticalAlign: 'middle' }}>{e.enrollmentStatus}</span>
                      )}
                      {e.completionStatus && (
                        <span
                          className={`badge ${e.completionStatus === 'Completed' ? 'badge-green' : e.completionStatus === 'InProgress' ? 'badge-blue' : 'badge-gray'}`}
                          style={{ verticalAlign: 'middle' }}
                        >
                          {e.completionStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEditEducation(e)}>Edit</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ kind: 'education', educationRecordId: e.educationRecordId })} disabled={deleteEducation.isPending}>Delete</button>
                  </div>
                </div>
                <div className="grid-3" style={{ gap: 12 }}>
                  {e.attendanceRate != null && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)' }}>{Math.round(e.attendanceRate * 100)}%</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Attendance rate</div>
                    </div>
                  )}
                  {e.progressPercent != null && (
                    <div style={{ textAlign: 'center', gridColumn: e.attendanceRate != null ? undefined : 'span 2' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--sage)' }}>{e.progressPercent}%</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Program progress</div>
                    </div>
                  )}
                </div>
                {e.progressPercent != null && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', maxWidth: 360 }}>
                      <div style={{ height: '100%', background: 'var(--sage)', borderRadius: 3, width: `${Math.min(100, Math.max(0, e.progressPercent))}%` }} />
                    </div>
                  </div>
                )}
                {e.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, marginBottom: 0 }}><strong>Notes:</strong> {e.notes}</p>}
              </div>
            ))
          }

          {showEducationModal && (
            <div className="modal-overlay" onClick={() => { setShowEducationModal(false); setEditingEducationRecordId(null); setEducationError(''); resetEducationForm() }}>
              <div className="modal" onClick={ev => ev.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header">
                  <h2>{editingEducationRecordId ? 'Edit Education Record' : 'Add Education Record'}</h2>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowEducationModal(false); setEditingEducationRecordId(null); setEducationError(''); resetEducationForm() }}>✕</button>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Record date</label>
                    <input type="date" value={educationForm.recordDate} onChange={ev => setEducationForm(p => ({ ...p, recordDate: ev.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Education level</label>
                    <select value={educationForm.educationLevel} onChange={ev => setEducationForm(p => ({ ...p, educationLevel: ev.target.value as typeof p.educationLevel }))}>
                      {EDUCATION_LEVEL_OPTIONS.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>School</label>
                    <select value={educationForm.schoolPick} onChange={ev => setEducationForm(p => ({ ...p, schoolPick: ev.target.value }))}>
                      {EDUCATION_SCHOOL_OPTIONS.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                      <option value={EDUCATION_SCHOOL_OTHER}>Custom name…</option>
                    </select>
                  </div>
                  {educationForm.schoolPick === EDUCATION_SCHOOL_OTHER && (
                    <div className="form-group">
                      <label>Custom school name</label>
                      <input type="text" value={educationForm.schoolCustom} onChange={ev => setEducationForm(p => ({ ...p, schoolCustom: ev.target.value }))} placeholder="e.g. partner institution" />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Enrollment status</label>
                    <select value={educationForm.enrollmentStatus} onChange={ev => setEducationForm(p => ({ ...p, enrollmentStatus: ev.target.value as typeof p.enrollmentStatus }))}>
                      {EDUCATION_ENROLLMENT_OPTIONS.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Completion status</label>
                    <select value={educationForm.completionStatus} onChange={ev => setEducationForm(p => ({ ...p, completionStatus: ev.target.value as typeof p.completionStatus }))}>
                      {EDUCATION_COMPLETION_OPTIONS.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Attendance rate (%)</label>
                    <input type="number" step="0.1" min={0} max={100} value={educationForm.attendanceRate} onChange={ev => setEducationForm(p => ({ ...p, attendanceRate: ev.target.value }))} placeholder="e.g. 85" />
                  </div>
                  <div className="form-group">
                    <label>Progress (%)</label>
                    <input type="number" step="0.1" min={0} max={100} value={educationForm.progressPercent} onChange={ev => setEducationForm(p => ({ ...p, progressPercent: ev.target.value }))} placeholder="0–100" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea rows={3} value={educationForm.notes} onChange={ev => setEducationForm(p => ({ ...p, notes: ev.target.value }))} style={{ resize: 'vertical' }} placeholder="Optional context, goals, or follow-up" />
                </div>
                {educationError && (
                  <div style={{ marginBottom: 12, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                    {educationError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowEducationModal(false); setEditingEducationRecordId(null); setEducationError(''); resetEducationForm() }}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={() => editingEducationRecordId ? editEducation.mutate(editingEducationRecordId) : addEducation.mutate()} disabled={addEducation.isPending || editEducation.isPending}>
                    {(addEducation.isPending || editEducation.isPending) ? 'Saving…' : (editingEducationRecordId ? 'Update record' : 'Save record')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#fee2e2', color: '#b91c1c' }}>
                <AlertTriangle size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Confirm Delete</h2>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {confirmDelete.kind === 'resident'
                ? 'This will permanently delete this resident and all related records (process recordings, visitations, education, health, intervention plans, and incident reports).'
                : confirmDelete.kind === 'recording'
                  ? 'This will permanently delete this process recording.'
                  : confirmDelete.kind === 'visitation'
                    ? 'This will permanently delete this visitation record.'
                    : confirmDelete.kind === 'intervention'
                      ? 'This will permanently delete this intervention plan.'
                      : confirmDelete.kind === 'health'
                        ? 'This will permanently delete this health record.'
                        : 'This will permanently delete this education record.'}
            </p>
            <p style={{ margin: '8px 0 0', color: '#b91c1c', fontSize: 13 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={deleteRes.isPending || deleteRec.isPending || deleteVisit.isPending || deletePlan.isPending || deleteHealth.isPending || deleteEducation.isPending}
                onClick={() => {
                  if (confirmDelete.kind === 'resident') {
                    deleteRes.mutate(undefined, {
                      onSuccess: () => setConfirmDelete(null),
                      onError: (err: any) => {
                        setDeleteError(err?.response?.data?.message || 'Unable to delete resident and related records.')
                      }
                    })
                    return
                  }
                  if (confirmDelete.kind === 'recording') {
                    deleteRec.mutate(confirmDelete.recordingId, {
                      onSuccess: () => setConfirmDelete(null)
                    })
                    return
                  }
                  if (confirmDelete.kind === 'visitation') {
                    deleteVisit.mutate(confirmDelete.visitationId, {
                      onSuccess: () => setConfirmDelete(null)
                    })
                    return
                  }
                  if (confirmDelete.kind === 'intervention') {
                    deletePlan.mutate(confirmDelete.planId, {
                      onSuccess: () => setConfirmDelete(null)
                    })
                    return
                  }
                  if (confirmDelete.kind === 'health') {
                    deleteHealth.mutate(confirmDelete.healthRecordId, {
                      onSuccess: () => setConfirmDelete(null)
                    })
                    return
                  }
                  if (confirmDelete.kind === 'education') {
                    deleteEducation.mutate(confirmDelete.educationRecordId, {
                      onSuccess: () => setConfirmDelete(null)
                    })
                  }
                }}
              >
                {(deleteRes.isPending || deleteRec.isPending || deleteVisit.isPending || deletePlan.isPending || deleteHealth.isPending || deleteEducation.isPending) ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
