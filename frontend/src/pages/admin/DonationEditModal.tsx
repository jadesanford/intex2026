import { useEffect, useState } from 'react'
import InKindLineItemsEditor from '../../components/InKindLineItemsEditor'
import {
  emptyInKindLine,
  donationTypeIsInKind,
  computeInKindLineSum,
  inKindLinesToPayload,
  type InKindLineForm
} from '../../lib/inKindDonationItems'

const CHANNELS = [
  'Website', 'BankTransfer', 'GCash', 'Maya', 'Church', 'Corporate',
  'DirectGiving', 'Event', 'SocialMedia', 'PartnerReferral'
] as const

const DONATION_TYPES = ['Monetary', 'InKind', 'Time', 'Skills', 'SocialMedia'] as const

export type { InKindLineForm }
export {
  emptyInKindLine,
  donationTypeIsInKind,
  inKindLinesToPayload,
  isInKindLineComplete,
  computeInKindLineSum,
  inKindApiToFormLines
} from '../../lib/inKindDonationItems'

export type DonationEditFormState = {
  supporterId: string
  amount: string
  estimatedValue: string
  donationType: string
  donationDate: string
  channelSource: string
  campaignName: string
  isRecurring: string
  notes: string
  inKindItems: InKindLineForm[]
}

export function emptyDonationForm(): DonationEditFormState {
  return {
    supporterId: '',
    amount: '',
    estimatedValue: '',
    donationType: 'Monetary',
    donationDate: new Date().toISOString().slice(0, 10),
    channelSource: 'Website',
    campaignName: '',
    isRecurring: 'false',
    notes: '',
    inKindItems: [emptyInKindLine()]
  }
}

export function donationRecordToForm(d: {
  supporterId?: number
  donationType?: string
  donationDate?: string
  channelSource?: string
  campaignName?: string
  isRecurring?: boolean
  notes?: string
  amount?: number
  estimatedValue?: number
}): DonationEditFormState {
  const t = d.donationType || 'Monetary'
  return {
    supporterId: d.supporterId != null ? String(d.supporterId) : '',
    amount: t === 'Monetary' && d.amount != null ? String(d.amount) : '',
    estimatedValue: t !== 'Monetary' && d.estimatedValue != null ? String(d.estimatedValue) : '',
    donationType: t,
    donationDate: d.donationDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    channelSource: d.channelSource || 'Website',
    campaignName: d.campaignName || '',
    isRecurring: d.isRecurring ? 'true' : 'false',
    notes: d.notes || '',
    inKindItems: donationTypeIsInKind(t) ? [emptyInKindLine()] : []
  }
}

export function formToDonationPatch(form: DonationEditFormState): Record<string, unknown> {
  const isMonetary = form.donationType === 'Monetary'
  const isInKind = donationTypeIsInKind(form.donationType)
  let estimatedValue: number | null = null
  if (!isMonetary) {
    const manual = form.estimatedValue.trim()
    if (isInKind) {
      const fromLines = computeInKindLineSum(form.inKindItems)
      estimatedValue = manual !== '' ? Number(manual) : fromLines
    } else {
      estimatedValue = manual !== '' ? Number(manual) : null
    }
  }
  return {
    supporterId: form.supporterId ? Number(form.supporterId) : null,
    donationType: form.donationType,
    donationDate: form.donationDate,
    channelSource: form.channelSource,
    currencyCode: 'PHP',
    amount: isMonetary && form.amount.trim() !== '' ? Number(form.amount) : null,
    estimatedValue,
    isRecurring: form.isRecurring === 'true',
    campaignName: form.campaignName || null,
    notes: form.notes || null
  }
}

type SupporterOption = { supporterId: number; displayName: string; organizationName: string }

type Props = {
  open: boolean
  title: string
  supporters: SupporterOption[]
  initial: DonationEditFormState | null
  /** When true, donation type field is read-only (e.g. in-kind detail). */
  lockDonationType?: boolean
  onClose: () => void
  onSave: (form: DonationEditFormState) => void
  isPending: boolean
  error?: string
}

export default function DonationEditModal({
  open,
  title,
  supporters,
  initial,
  lockDonationType,
  onClose,
  onSave,
  isPending,
  error
}: Props) {
  const [form, setForm] = useState<DonationEditFormState>(() => emptyDonationForm())

  useEffect(() => {
    if (open && initial) setForm(initial)
  }, [open, initial])

  if (!open) return null

  const isMonetary = form.donationType === 'Monetary'
  const isInKind = donationTypeIsInKind(form.donationType)
  const lineSum = computeInKindLineSum(form.inKindItems)
  const canSave = isMonetary
    ? form.amount.trim() !== ''
    : isInKind
      ? inKindLinesToPayload(form.inKindItems).length >= 1
      : true

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: isInKind ? 720 : undefined, width: '100%' }}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>
        )}
        <div className="grid-2">
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Donor</label>
            <select
              value={form.supporterId}
              onChange={e => setForm(p => ({ ...p, supporterId: e.target.value }))}
            >
              <option value="">Anonymous</option>
              {supporters.map(s => (
                <option key={s.supporterId} value={s.supporterId}>
                  {s.displayName || s.organizationName}
                </option>
              ))}
            </select>
          </div>
          {isMonetary ? (
            <div className="form-group">
              <label>Amount (₱)</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0"
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Estimated value (₱)</label>
              <input
                type="number"
                value={form.estimatedValue}
                onChange={e => setForm(p => ({ ...p, estimatedValue: e.target.value }))}
                placeholder={isInKind ? String(lineSum || 0) : '0'}
              />
              {isInKind && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  Leave blank to use line total (qty × unit): ₱{lineSum.toLocaleString()}
                </p>
              )}
            </div>
          )}
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={form.donationDate}
              onChange={e => setForm(p => ({ ...p, donationDate: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select
              value={form.donationType}
              disabled={lockDonationType}
              onChange={e => {
                const v = e.target.value
                setForm(p => {
                  const next: DonationEditFormState = {
                    ...p,
                    donationType: v,
                    amount: v === 'Monetary' ? p.amount : '',
                    estimatedValue: v !== 'Monetary' ? p.estimatedValue : ''
                  }
                  if (donationTypeIsInKind(v)) {
                    next.inKindItems = p.inKindItems.length ? p.inKindItems : [emptyInKindLine()]
                  } else {
                    next.inKindItems = []
                  }
                  return next
                })
              }}
            >
              {DONATION_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Channel</label>
            <select
              value={form.channelSource}
              onChange={e => setForm(p => ({ ...p, channelSource: e.target.value }))}
            >
              {CHANNELS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Campaign</label>
            <input
              value={form.campaignName}
              onChange={e => setForm(p => ({ ...p, campaignName: e.target.value }))}
              placeholder="e.g. Year-end Appeal"
            />
          </div>
          <div className="form-group">
            <label>Recurring</label>
            <select
              value={form.isRecurring}
              onChange={e => setForm(p => ({ ...p, isRecurring: e.target.value }))}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>

        {isInKind && (
          <InKindLineItemsEditor
            items={form.inKindItems}
            onChange={inKindItems => setForm(p => ({ ...p, inKindItems }))}
          />
        )}

        <div className="form-group">
          <label>Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canSave || isPending}
            onClick={() => onSave(form)}
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
