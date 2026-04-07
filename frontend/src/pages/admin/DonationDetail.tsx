import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDonation, getSupporters, updateDonation, deleteDonation, syncDonationInKindItems } from '../../lib/api'
import DonationEditModal, {
  donationRecordToForm,
  formToDonationPatch,
  type DonationEditFormState
} from './DonationEditModal'
import { donationTypeIsInKind, inKindLinesToPayload, inKindApiToFormLines } from '../../lib/inKindDonationItems'
import { ArrowLeft } from 'lucide-react'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/** Full-precision peso amount (no ₱K/₱M rounding) for per-unit values */
function formatPHPUnitValue(n: number) {
  return `₱${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
    useGrouping: true
  }).format(n)}`
}

type DonationPayload = {
  donationId: number
  supporterId?: number
  donationType?: string
  donationDate?: string
  channelSource?: string
  currencyCode?: string
  amount?: number
  estimatedValue?: number
  campaignName?: string
  notes?: string
  isRecurring?: boolean
}

type InKindItemRow = {
  itemId: number
  donationId?: number
  itemName?: string
  itemCategory?: string
  quantity?: number
  unitOfMeasure?: string
  estimatedUnitValue?: number
  intendedUse?: string
  receivedCondition?: string
}

/** Map API or raw JSON (camelCase or snake_case) to in_kind_donation_items shape */
function parseInKindItems(raw: unknown): InKindItemRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((row): InKindItemRow => {
    const o = row as Record<string, unknown>
    const num = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : Number(v))
    const str = (v: unknown) => (v == null ? undefined : String(v))
    return {
      itemId: num(o.itemId ?? o.item_id) ?? 0,
      donationId: num(o.donationId ?? o.donation_id),
      itemName: str(o.itemName ?? o.item_name),
      itemCategory: str(o.itemCategory ?? o.item_category),
      quantity: num(o.quantity) !== undefined && !Number.isNaN(Number(o.quantity)) ? Number(o.quantity) : undefined,
      unitOfMeasure: str(o.unitOfMeasure ?? o.unit_of_measure),
      estimatedUnitValue: num(o.estimatedUnitValue ?? o.estimated_unit_value),
      intendedUse: str(o.intendedUse ?? o.intended_use),
      receivedCondition: str(o.receivedCondition ?? o.received_condition)
    }
  })
}

const giftRowStyle = {
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  fontSize: 14,
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: 8
}

export default function DonationDetail() {
  const { id } = useParams<{ id: string }>()
  const did = +id!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editError, setEditError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['donation', did],
    queryFn: () => getDonation(did)
  })
  const { data: supporters } = useQuery({ queryKey: ['supporters'], queryFn: () => getSupporters() })

  const update = useMutation({
    mutationFn: async (f: DonationEditFormState) => {
      await updateDonation(did, formToDonationPatch(f))
      await syncDonationInKindItems(
        did,
        donationTypeIsInKind(f.donationType) ? inKindLinesToPayload(f.inKindItems) : []
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donation', did] })
      qc.invalidateQueries({ queryKey: ['all-donations'] })
      qc.invalidateQueries({ queryKey: ['donation-summary'] })
      setEditOpen(false)
      setEditError('')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setEditError(err?.response?.data?.message || 'Unable to update donation.')
    }
  })

  const remove = useMutation({
    mutationFn: () => deleteDonation(did),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-donations'] })
      qc.invalidateQueries({ queryKey: ['donation-summary'] })
      navigate('/admin/donations')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      window.alert(err?.response?.data?.message || 'Unable to delete donation.')
    }
  })

  const saveEdit = (f: DonationEditFormState) => {
    setEditError('')
    update.mutate(f)
  }

  const confirmDelete = () => {
    if (!window.confirm(`Delete donation #${did}? This cannot be undone.`)) return
    remove.mutate()
  }

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>
  if (isError || !data) return <div className="card" style={{ padding: 24 }}>Donation not found.</div>

  const d = data.donation as DonationPayload
  const items = parseInKindItems(data.inKindItems)
  const sup = data.supporters as { displayName?: string; organizationName?: string; supporterType?: string; email?: string } | null
  const donorName = sup?.displayName || sup?.organizationName || 'Anonymous'
  const isInKind = donationTypeIsInKind(d.donationType)
  const hasLineItems = items.length > 0

  const lineTotal = items.reduce((sum, row) => {
    const q = row.quantity ?? 0
    const u = row.estimatedUnitValue ?? 0
    return sum + q * u
  }, 0)

  return (
    <div>
      <Link
        to="/admin/donations"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-muted)',
          fontSize: 14,
          marginBottom: 20
        }}
      >
        <ArrowLeft size={16} /> Back to Donations
      </Link>

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Donation #{d.donationId}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={d.donationType === 'Monetary' ? 'badge badge-green' : 'badge badge-blue'}>{d.donationType || '—'}</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{d.donationDate?.slice(0, 10) || '—'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>
              {d.donationType === 'Monetary' ? formatPHP(d.amount ?? 0) : formatPHP(d.estimatedValue ?? lineTotal)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {d.donationType === 'Monetary' ? 'Amount' : 'Estimated value (gift / line total)'}
            </div>
          </div>
          {isInKind && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setEditError('')
                  setEditOpen(true)
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={confirmDelete}
                disabled={remove.isPending}
              >
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      <DonationEditModal
        open={editOpen}
        title="Edit donation"
        supporters={(supporters ?? []) as { supporterId: number; displayName: string; organizationName: string }[]}
        initial={
          editOpen
            ? {
                ...donationRecordToForm(d),
                inKindItems: inKindApiToFormLines(data.inKindItems)
              }
            : null
        }
        lockDonationType
        onClose={() => {
          setEditOpen(false)
          setEditError('')
        }}
        onSave={saveEdit}
        isPending={update.isPending}
        error={editError}
      />

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Donor &amp; gift</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Donor', donorName],
              ['Email', sup?.email || '—'],
              ['Supporter type', sup?.supporterType || '—'],
              ['Channel', d.channelSource || '—'],
              ['Campaign', d.campaignName || '—'],
              ['Recurring', d.isRecurring ? 'Yes' : 'No'],
              ['Currency', d.currencyCode || 'PHP']
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
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          {d.notes && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 14, marginBottom: 0 }}>
              <strong>Notes:</strong> {d.notes}
            </p>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>In-kind summary</h3>
          {!isInKind && !hasLineItems ? (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              This is not an in-kind donation, and there are no in-kind line items for this gift.
            </p>
          ) : !hasLineItems ? (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              No in-kind line items for this donation yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {!isInKind && (
                <p style={{ fontSize: 13, color: 'var(--terracotta)', margin: '0 0 14px' }}>
                  Donation type is “{d.donationType || '—'}”, but line items are recorded for this gift.
                </p>
              )}
              {items.map((row, idx) => {
                const q = row.quantity ?? 0
                const u = row.estimatedUnitValue ?? 0
                const uom = row.unitOfMeasure?.trim()
                const qtyLabel =
                  uom && uom.length > 0 ? `${q} (${uom})` : String(q)
                const rows: [string, React.ReactNode][] = [
                  ['Item', row.itemName || '—'],
                  ['Category', row.itemCategory || '—'],
                  ['Quantity', qtyLabel],
                  ['Estimated unit value', formatPHPUnitValue(u)],
                  ['Intended use', row.intendedUse || '—'],
                  ['Condition', <span key="c" className="badge badge-gray">{row.receivedCondition || '—'}</span>]
                ]
                return (
                  <div
                    key={`inkind-${row.itemId}-${idx}`}
                    style={{
                      paddingTop: idx > 0 ? 20 : 0,
                      marginTop: idx > 0 ? 20 : 0,
                      borderTop: idx > 0 ? '1px solid var(--border)' : undefined
                    }}
                  >
                    {items.length > 1 && (
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          marginBottom: 12
                        }}
                      >
                        Line item {idx + 1}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {rows.map(([k, v]) => (
                        <div key={k} style={giftRowStyle}>
                          <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                          <span style={{ fontWeight: 500 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
