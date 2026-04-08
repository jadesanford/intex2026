import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { getPartner, deletePartner } from '../../lib/api'

type AssignmentRow = {
  assignmentId: number
  partnerId: number
  safehouseId?: number | null
  programArea?: string
  assignmentStart?: string
  assignmentEnd?: string
  responsibilityNotes?: string
  isPrimary?: boolean
  status?: string
  safehouses?: { name?: string; city?: string } | null
}

type PartnerRow = {
  partnerId: number
  partnerName: string
  partnerType?: string
  roleType?: string
  contactName?: string
  email?: string
  phone?: string
  region?: string
  status?: string
  startDate?: string
  endDate?: string
  notes?: string
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: { message?: string; detail?: string; title?: string } } })?.response?.data
  if (!d) return fallback
  return d.message || d.detail || d.title || fallback
}

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>()
  const pid = +id!
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['partner', pid],
    queryFn: () => getPartner(pid)
  })

  const remove = useMutation({
    mutationFn: () => deletePartner(pid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
      navigate('/admin/partners')
    },
    onError: (err: unknown) => setDeleteError(apiErrorMessage(err, 'Unable to delete partner.'))
  })

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>
  if (!data?.partner) return <div className="card" style={{ padding: 24 }}>Partner not found.</div>

  const partner = data.partner as PartnerRow
  const assignments = (data.assignments ?? []) as AssignmentRow[]
  const activeAssignments = assignments.filter(a => (a.status || 'Active') === 'Active').length

  return (
    <div>
      <Link
        to="/admin/partners"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}
      >
        <ArrowLeft size={16} /> Back to Partners
      </Link>

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>{partner.partnerName}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-gray">{partner.partnerType || '—'}</span>
            <span className="badge badge-blue">{partner.roleType || '—'}</span>
            <span className={`badge ${(partner.status || 'Active') === 'Active' ? 'badge-green' : 'badge-gray'}`}>{partner.status || 'Active'}</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            setDeleteError('')
            setConfirmDelete(true)
          }}
          disabled={remove.isPending}
        >
          {remove.isPending ? 'Deleting...' : 'Delete Partner'}
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--terracotta)' }}>{assignments.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Total assignments</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--sage)' }}>{activeAssignments}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Active assignments</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>{partner.region || '—'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Region</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Partner Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div><strong>Contact:</strong> {partner.contactName || '—'}</div>
            <div><strong>Email:</strong> {partner.email || '—'}</div>
            <div><strong>Phone:</strong> {partner.phone || '—'}</div>
            <div><strong>Start Date:</strong> {partner.startDate?.slice(0, 10) || '—'}</div>
            <div><strong>End Date:</strong> {partner.endDate?.slice(0, 10) || '—'}</div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Notes</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7 }}>{partner.notes || 'No notes.'}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Partner Assignments</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Program Area</th>
                <th>Safehouse</th>
                <th>Assignment Dates</th>
                <th>Primary</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.assignmentId}>
                  <td>{a.programArea || '—'}</td>
                  <td>{a.safehouses?.name ? `${a.safehouses.name}${a.safehouses.city ? ` (${a.safehouses.city})` : ''}` : 'Unassigned'}</td>
                  <td style={{ fontSize: 13 }}>
                    {(a.assignmentStart || '').slice(0, 10) || '—'}
                    {' '}to{' '}
                    {(a.assignmentEnd || '').slice(0, 10) || 'Present'}
                  </td>
                  <td>{a.isPrimary ? <span style={{ color: 'var(--success)' }}>Yes</span> : 'No'}</td>
                  <td><span className={`badge ${(a.status || 'Active') === 'Active' ? 'badge-green' : 'badge-gray'}`}>{a.status || 'Active'}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.responsibilityNotes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignments.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No assignments found for this partner.
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => { setConfirmDelete(false); setDeleteError('') }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#fee2e2', color: '#b91c1c' }}>
                <AlertTriangle size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Delete partner</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This will permanently remove <strong>{partner.partnerName}</strong> and all assignment rows tied to this partner.
              This action cannot be undone.
            </p>
            {deleteError && <p style={{ margin: '12px 0 0', color: '#b91c1c', fontSize: 13 }}>{deleteError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setConfirmDelete(false); setDeleteError('') }}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" disabled={remove.isPending} onClick={() => remove.mutate()}>
                {remove.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
