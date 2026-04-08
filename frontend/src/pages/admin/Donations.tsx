import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDonations,
  getDonation,
  getDonationSummary,
  getSupporters,
  createDonation,
  updateDonation,
  deleteDonation,
  syncDonationInKindItems
} from '../../lib/api'
import DonationEditModal, {
  donationRecordToForm,
  formToDonationPatch,
  emptyDonationForm,
  type DonationEditFormState
} from './DonationEditModal'
import {
  donationTypeIsInKind,
  inKindLinesToPayload,
  inKindApiToFormLines
} from '../../lib/inKindDonationItems'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

type DonationRow = {
  donationId: number
  supporterId?: number
  donationDate: string
  channelSource: string
  campaignName: string
  donationType: string
  amount: number
  estimatedValue: number
  currencyCode: string
  isRecurring: boolean
  notes?: string
  supporters?: { displayName: string; organizationName: string; supporterType: string }
}

type SupporterRow = { supporterId: number; displayName: string; organizationName: string }

const DONATION_TYPE_FILTERS = ['', 'Monetary', 'InKind', 'Time', 'Skills', 'SocialMedia'] as const
type RecurringFilter = '' | 'yes' | 'no'

function donationMatchesSearch(d: DonationRow, q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return true
  const donor = `${d.supporters?.displayName || ''} ${d.supporters?.organizationName || ''}`.toLowerCase()
  const idStr = String(d.donationId)
  if (idStr.includes(s)) return true
  if (donor.includes(s)) return true
  if ((d.campaignName || '').toLowerCase().includes(s)) return true
  if ((d.channelSource || '').toLowerCase().includes(s)) return true
  if ((d.notes || '').toLowerCase().includes(s)) return true
  if ((d.donationType || '').toLowerCase().includes(s)) return true
  return false
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: { message?: string; detail?: string; title?: string } } })?.response?.data
  if (!d) return fallback
  return d.message || d.detail || d.title || fallback
}

export default function Donations() {
  const qc = useQueryClient()
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [recurringFilter, setRecurringFilter] = useState<RecurringFilter>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editRow, setEditRow] = useState<DonationRow | null>(null)
  const [editError, setEditError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DonationRow | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const editingInKind = !!editRow && donationTypeIsInKind(editRow.donationType)
  const { data: editDonationDetail, isLoading: editDetailLoading, isError: editDetailError } = useQuery({
    queryKey: ['donation', editRow?.donationId],
    queryFn: () => getDonation(editRow!.donationId),
    enabled: editingInKind && !!editRow
  })

  useEffect(() => {
    if (editDetailError && editingInKind && editRow) {
      window.alert('Could not load line items for this donation.')
      setEditRow(null)
    }
  }, [editDetailError, editingInKind, editRow])

  const editModalInitial = useMemo((): DonationEditFormState | null => {
    if (!editRow) return null
    const base = donationRecordToForm(editRow)
    if (donationTypeIsInKind(editRow.donationType)) {
      if (!editDonationDetail) return null
      return {
        ...base,
        inKindItems: inKindApiToFormLines(editDonationDetail.inKindItems)
      }
    }
    return { ...base, inKindItems: [] }
  }, [editRow, editDonationDetail])

  const editModalOpen = !!editRow && (!editingInKind || (!editDetailLoading && editModalInitial !== null))

  const createModalInitial = useMemo(() => emptyDonationForm(), [showModal])

  const donationQueryParams = useMemo(() => {
    const p: Record<string, string | number> = { pageSize: 500 }
    if (typeFilter) p.type = typeFilter
    if (recurringFilter === 'yes') p.recurring = 'true'
    if (recurringFilter === 'no') p.recurring = 'false'
    return p
  }, [typeFilter, recurringFilter])

  const { data: donations, isLoading } = useQuery({
    queryKey: ['all-donations', typeFilter, recurringFilter],
    queryFn: () => getDonations(donationQueryParams)
  })

  const filteredDonations = useMemo(() => {
    const rows = (donations ?? []) as DonationRow[]
    return rows.filter(d => donationMatchesSearch(d, searchQuery))
  }, [donations, searchQuery])
  const { data: summary } = useQuery({ queryKey: ['donation-summary'], queryFn: getDonationSummary })
  const { data: supporters } = useQuery({ queryKey: ['supporters'], queryFn: () => getSupporters() })

  const createFull = useMutation({
    mutationFn: async (form: DonationEditFormState) => {
      const created = (await createDonation(formToDonationPatch(form))) as { donationId: number }
      const id = created.donationId
      if (donationTypeIsInKind(form.donationType)) {
        await syncDonationInKindItems(id, inKindLinesToPayload(form.inKindItems))
      }
      return created
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-donations'] })
      qc.invalidateQueries({ queryKey: ['donation-summary'] })
      setShowModal(false)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      window.alert(err?.response?.data?.message || 'Unable to record donation.')
    }
  })

  const update = useMutation({
    mutationFn: async ({ id, form }: { id: number; form: DonationEditFormState }) => {
      await updateDonation(id, formToDonationPatch(form))
      await syncDonationInKindItems(
        id,
        donationTypeIsInKind(form.donationType) ? inKindLinesToPayload(form.inKindItems) : []
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-donations'] })
      qc.invalidateQueries({ queryKey: ['donation-summary'] })
      qc.invalidateQueries({ queryKey: ['donation'] })
      setEditRow(null)
      setEditError('')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setEditError(err?.response?.data?.message || 'Unable to update donation.')
    }
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteDonation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-donations'] })
      qc.invalidateQueries({ queryKey: ['donation-summary'] })
      setDeleteTarget(null)
      setDeleteError('')
    },
    onError: (err: unknown) => {
      setDeleteError(apiErrorMessage(err, 'Unable to delete donation.'))
    }
  })

  const saveEdit = (f: DonationEditFormState) => {
    if (!editRow) return
    setEditError('')
    update.mutate({ id: editRow.donationId, form: f })
  }

  const chartData = (summary?.monthly ?? []).map((m: { month: string; total: number }) => ({
    month: m.month?.slice(5), amount: Math.round(m.total / 1_000)
  })).slice(-8)

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 28 }}>Donations</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Record Donation</button>
      </div>

      {summary && (
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--sage)' }}>{formatPHP(summary.total || 0)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Total Monetary</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--terracotta)' }}>{summary.count}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Total Records</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--navy)' }}>
              {formatPHP(summary.monetaryCount > 0 ? (summary.total / summary.monetaryCount) : 0)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Average Gift</div>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Monthly Donation Trend (₱ Thousands)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₱${v}K`} />
              <Tooltip formatter={(v: number) => [`₱${v}K`, 'Total']} />
              <Bar dataKey="amount" fill="var(--terracotta)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'flex-end'
          }}
        >
          <div className="form-group" style={{ flex: '1 1 220px', marginBottom: 0, minWidth: 200 }}>
            <label style={{ fontSize: 12 }}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="search"
                placeholder="ID, donor, campaign, channel, notes…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
            <label style={{ fontSize: 12 }}>Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              {DONATION_TYPE_FILTERS.map(t => (
                <option key={t || 'all'} value={t}>{t === '' ? 'All types' : t}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
            <label style={{ fontSize: 12 }}>Recurring</label>
            <select value={recurringFilter} onChange={e => setRecurringFilter(e.target.value as RecurringFilter)}>
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        {isLoading ? <div className="loading-center"><div className="spinner" /></div>
          : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Date</th><th>Donor</th><th>Amount</th><th>Type</th><th>Campaign</th><th>Channel</th><th>Recurring</th><th>In-kind / actions</th></tr></thead>
                <tbody>
                  {filteredDonations.map((d: DonationRow) => {
                    const donorName = d.supporters?.displayName || d.supporters?.organizationName || 'Anonymous'
                    const val = d.donationType === 'Monetary' ? d.amount : d.estimatedValue
                    return (
                      <tr key={d.donationId}>
                        <td style={{ fontSize: 13 }}>{d.donationDate?.slice(0, 10)}</td>
                        <td style={{ fontWeight: 500 }}>{donorName}</td>
                        <td style={{ fontWeight: 700, color: 'var(--sage)' }}>{val ? formatPHP(val) : '—'}</td>
                        <td><span className={d.donationType === 'Monetary' ? 'badge badge-green' : 'badge badge-blue'}>{d.donationType}</span></td>
                        <td style={{ fontSize: 13 }}>{d.campaignName || '—'}</td>
                        <td style={{ fontSize: 13 }}>{d.channelSource || '—'}</td>
                        <td style={{ fontSize: 13 }}>{d.isRecurring ? <span style={{ color: 'var(--success)' }}>✓</span> : '—'}</td>
                        <td>
                          {donationTypeIsInKind(d.donationType) ? (
                            <Link
                              to={`/admin/donations/${d.donationId}`}
                              style={{ color: 'var(--terracotta)', fontSize: 13, fontWeight: 500 }}
                            >
                              View donation →
                            </Link>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                  setEditError('')
                                  setEditRow(d)
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setDeleteError('')
                                  setDeleteTarget(d)
                                }}
                                disabled={remove.isPending}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!isLoading && filteredDonations.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No donations match your filters or search.
                </div>
              )}
            </div>
          )}
      </div>

      <DonationEditModal
        open={editModalOpen}
        title="Edit donation"
        supporters={(supporters ?? []) as SupporterRow[]}
        initial={editModalInitial}
        onClose={() => {
          setEditRow(null)
          setEditError('')
        }}
        onSave={saveEdit}
        isPending={update.isPending}
        error={editError}
      />

      <DonationEditModal
        open={showModal}
        title="Record donation"
        supporters={(supporters ?? []) as SupporterRow[]}
        initial={createModalInitial}
        onClose={() => setShowModal(false)}
        onSave={f => createFull.mutate(f)}
        isPending={createFull.isPending}
      />

      {deleteTarget && (
        <div
          className="modal-overlay"
          onClick={() => {
            setDeleteTarget(null)
            setDeleteError('')
          }}
        >
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#fee2e2', color: '#b91c1c' }}>
                <AlertTriangle size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Delete donation</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This will permanently delete donation #{deleteTarget.donationId}. This action cannot be undone.
            </p>
            {deleteError && <p style={{ margin: '12px 0 0', color: '#b91c1c', fontSize: 13 }}>{deleteError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDeleteTarget(null)
                  setDeleteError('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleteTarget.donationId)}
              >
                {remove.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
