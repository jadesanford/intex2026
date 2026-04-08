import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupporter, updateSupporter, deleteSupporter } from '../../lib/api'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import SupporterFormFields from './SupporterFormFields'
import {
  defaultSupporterForm,
  supporterRecordToForm,
  formToSupporterPayload,
  canSaveSupporterForm,
  type SupporterFormState
} from '../../lib/supporterForm'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

type DonationRow = {
  donationId: number
  donationDate: string
  amount: number
  estimatedValue: number
  donationType: string
  campaignName: string
  channelSource: string
  isRecurring: boolean
}

type SupporterDetail = {
  supporterId: number
  supporterType?: string
  displayName?: string
  organizationName?: string
  firstName?: string
  lastName?: string
  relationshipType?: string
  region?: string
  country?: string
  email?: string
  phone?: string
  status?: string
  firstDonationDate?: string
  acquisitionChannel?: string
  createdAt?: string
}

export default function DonorDetail() {
  const { id } = useParams<{ id: string }>()
  const sid = +id!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [form, setForm] = useState<SupporterFormState>(() => defaultSupporterForm())
  const [saveError, setSaveError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['supporter', sid], queryFn: () => getSupporter(sid) })

  const update = useMutation({
    mutationFn: () => updateSupporter(sid, formToSupporterPayload(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supporter', sid] })
      qc.invalidateQueries({ queryKey: ['supporters'] })
      setShowEditModal(false)
      setSaveError('')
    },
    onError: (err: any) => {
      setSaveError(err?.response?.data?.message || 'Unable to update supporter.')
    }
  })

  const remove = useMutation({
    mutationFn: () => deleteSupporter(sid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supporters'] })
      navigate('/admin/donors')
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.message || 'Unable to delete supporter.')
    }
  })

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>
  if (!data) return <div>Supporter not found.</div>

  const { supporter: s, donations } = data as { supporter: SupporterDetail; donations: DonationRow[] }
  const name = s.displayName || s.organizationName || `${s.firstName || ''} ${s.lastName || ''}`.trim()
  const monetary = (donations ?? []).filter((d: DonationRow) => d.donationType === 'Monetary')
  const total = monetary.reduce((sum: number, d: DonationRow) => sum + (d.amount || 0), 0)

  const byChannel = (donations ?? []).reduce((acc: Record<string, number>, d: DonationRow) => {
    const ch = d.channelSource || 'Unknown'
    acc[ch] = (acc[ch] || 0) + (d.amount || 0)
    return acc
  }, {})

  const openEdit = () => {
    setForm(supporterRecordToForm(s))
    setSaveError('')
    setShowEditModal(true)
  }

  const closeEdit = () => {
    setShowEditModal(false)
    setSaveError('')
    setForm(defaultSupporterForm())
  }

  const save = () => {
    setSaveError('')
    if (!canSaveSupporterForm(form)) {
      setSaveError('Enter a display name, organization name, or both first and last name.')
      return
    }
    update.mutate()
  }

  const createdLabel = s.createdAt
    ? new Date(s.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <div>
      <Link
        to="/admin/donors"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}
      >
        <ArrowLeft size={16} /> Back to Donors
      </Link>

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>{name}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-blue">{s.supporterType}</span>
            <span className={`badge ${s.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
            {s.relationshipType && <span className="badge badge-gray">{s.relationshipType}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>
              {formatPHP(total)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total monetary contributions</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={openEdit}>
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                setConfirmDelete(true)
                setDeleteError('')
              }}
              disabled={remove.isPending}
            >
              {remove.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Contact Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Email', s.email || '—'],
              ['Phone', s.phone || '—'],
              ['Region', s.region || '—'],
              ['Country', s.country || '—'],
              ['Acquisition channel', s.acquisitionChannel || '—'],
              ['First donation', s.firstDonationDate?.slice(0, 10) || '—'],
              ['Record created', createdLabel]
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  borderBottom: '1px solid #f3f4f6',
                  paddingBottom: 8
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Giving Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Total Records', (donations ?? []).length],
              ['Monetary Donations', monetary.length],
              ['Total Amount', formatPHP(total)],
              ['Avg Gift', formatPHP(total / Math.max(1, monetary.length))],
              ['Last Gift', monetary[0]?.donationDate?.slice(0, 10) || 'None']
            ].map(([k, v]) => (
              <div
                key={k as string}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  borderBottom: '1px solid #f3f4f6',
                  paddingBottom: 8
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          {Object.keys(byChannel).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                By Channel
              </div>
              {Object.entries(byChannel).map(([ch, amt]) => (
                <div key={ch} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{ch}</span>
                  <span style={{ fontWeight: 500 }}>{formatPHP(amt as number)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16 }}>Donation History</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Recurring</th>
              </tr>
            </thead>
            <tbody>
              {(donations ?? []).map((d: DonationRow) => (
                <tr key={d.donationId}>
                  <td>{d.donationDate?.slice(0, 10)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--sage)' }}>
                    {d.donationType === 'Monetary'
                      ? formatPHP(d.amount || 0)
                      : `₱${d.estimatedValue?.toLocaleString() || 0} est.`}
                  </td>
                  <td>
                    <span className={d.donationType === 'Monetary' ? 'badge badge-green' : 'badge badge-blue'}>{d.donationType}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{d.campaignName || '—'}</td>
                  <td style={{ fontSize: 13 }}>{d.channelSource || '—'}</td>
                  <td>{d.isRecurring ? <span style={{ color: 'var(--success)' }}>✓</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>Edit Supporter</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeEdit}>
                ✕
              </button>
            </div>
            <SupporterFormFields form={form} setForm={setForm} isEdit />
            {saveError && (
              <div
                style={{
                  marginTop: 12,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13
                }}
              >
                {saveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={closeEdit}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={!canSaveSupporterForm(form) || update.isPending}>
                {update.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="modal-overlay"
          onClick={() => {
            setConfirmDelete(false)
            setDeleteError('')
          }}
        >
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#fee2e2',
                  color: '#b91c1c'
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Delete supporter</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This will remove {name}. You cannot undo this. Related donations or login accounts may prevent deletion.
            </p>
            {deleteError && <p style={{ margin: '12px 0 0', color: '#b91c1c', fontSize: 13 }}>{deleteError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setConfirmDelete(false)
                  setDeleteError('')
                }}
              >
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
