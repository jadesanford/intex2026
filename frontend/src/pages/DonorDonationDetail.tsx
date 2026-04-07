import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package } from 'lucide-react'
import { getMyDonationDetails } from '../lib/api'
import { donationTypeIsInKind } from '../lib/inKindDonationItems'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatPHPUnitValue(n: number) {
  return `₱${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
    useGrouping: true
  }).format(n)}`
}

type DonationPayload = {
  donationId: number
  donationType?: string
  donationDate?: string
  channelSource?: string
  currencyCode?: string
  amount?: number
  estimatedValue?: number
  impactUnit?: string
  campaignName?: string
  notes?: string
  isRecurring?: boolean
}

type ItemRow = {
  itemName?: string
  itemCategory?: string
  quantity?: number
  unitOfMeasure?: string
  estimatedUnitValue?: number
  intendedUse?: string
  receivedCondition?: string
}

function parseItems(raw: unknown): ItemRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map(row => {
    const o = row as Record<string, unknown>
    const num = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : Number(v))
    const str = (v: unknown) => (v == null ? undefined : String(v))
    return {
      itemName: str(o.itemName ?? o.item_name),
      itemCategory: str(o.itemCategory ?? o.item_category),
      quantity: num(o.quantity),
      unitOfMeasure: str(o.unitOfMeasure ?? o.unit_of_measure),
      estimatedUnitValue: num(o.estimatedUnitValue ?? o.estimated_unit_value),
      intendedUse: str(o.intendedUse ?? o.intended_use),
      receivedCondition: str(o.receivedCondition ?? o.received_condition)
    }
  })
}

const copy = {
  en: {
    back: 'Back to dashboard',
    notFound: 'We could not find this donation in your history.',
    title: 'Donation',
    summary: 'Gift details',
    type: 'Type',
    date: 'Date',
    value: 'Value',
    campaign: 'Campaign',
    channel: 'Channel',
    recurring: 'Recurring',
    currency: 'Currency',
    impactUnit: 'Impact unit',
    notes: 'Notes',
    yes: 'Yes',
    no: 'No',
    inKindItems: 'Items you donated',
    item: 'Item',
    category: 'Category',
    quantity: 'Quantity',
    unitValue: 'Est. unit value',
    intendedUse: 'Intended use',
    condition: 'Condition',
    lineIntro: 'Each row is one item from your in-kind gift.',
  },
  tl: {
    back: 'Bumalik sa dashboard',
    notFound: 'Hindi namin mahanap ang donasyong ito sa iyong kasaysayan.',
    title: 'Donasyon',
    summary: 'Detalye ng regalo',
    type: 'Uri',
    date: 'Petsa',
    value: 'Halaga',
    campaign: 'Kampanya',
    channel: 'Pinagmulan',
    recurring: 'Paulit-ulit',
    currency: 'Currency',
    impactUnit: 'Yunit ng epekto',
    notes: 'Mga tala',
    yes: 'Oo',
    no: 'Hindi',
    inKindItems: 'Mga item na idinonate mo',
    item: 'Item',
    category: 'Kategorya',
    quantity: 'Dami',
    unitValue: 'Tinataya bawat yunit',
    intendedUse: 'Layuning gamitin',
    condition: 'Kondisyon',
    lineIntro: 'Bawat row ay isang item mula sa iyong in-kind na regalo.',
  }
}

const rowStyle = {
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  fontSize: 14,
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: 8
}

export default function DonorDonationDetail({ lang }: { lang: 'en' | 'tl' }) {
  const tx = copy[lang]
  const { id } = useParams<{ id: string }>()
  const did = Number(id)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-donation', did],
    queryFn: () => getMyDonationDetails(did),
    enabled: Number.isFinite(did) && did > 0
  })

  if (isLoading) return <div className="loading-center" style={{ minHeight: '50vh' }}><div className="spinner" /></div>
  if (isError || !data) {
    return (
      <div style={{ maxWidth: 560, margin: '48px auto', padding: 24 }}>
        <p style={{ color: 'var(--text-muted)' }}>{tx.notFound}</p>
        <Link to="/donor" className="btn btn-outline" style={{ marginTop: 16 }}>{tx.back}</Link>
      </div>
    )
  }

  const d = data.donation as DonationPayload
  const items = parseItems(data.inKindItems)
  const isInKind = donationTypeIsInKind(d.donationType)
  const displayValue =
    d.donationType === 'Monetary'
      ? formatPHP(d.amount ?? 0)
      : formatPHP(d.estimatedValue ?? 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--beige)', padding: '32px 24px 48px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link
          to="/donor"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-muted)',
            fontSize: 14,
            marginBottom: 20
          }}
        >
          <ArrowLeft size={16} /> {tx.back}
        </Link>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, color: 'var(--navy)', marginBottom: 8 }}>
            {tx.title} #{d.donationId}
          </h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={d.donationType === 'Monetary' ? 'badge badge-green' : 'badge badge-blue'}>
              {d.donationType || '—'}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{d.donationDate?.slice(0, 10) || '—'}</span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 16, color: 'var(--navy)' }}>{tx.summary}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              [tx.type, d.donationType || '—'],
              [tx.date, d.donationDate?.slice(0, 10) || '—'],
              [tx.value, displayValue],
              [tx.campaign, d.campaignName || '—'],
              [tx.channel, d.channelSource || '—'],
              [tx.recurring, d.isRecurring ? tx.yes : tx.no],
              [tx.currency, d.currencyCode || 'PHP'],
              [tx.impactUnit, d.impactUnit || '—']
            ].map(([k, v]) => (
              <div key={k as string} style={rowStyle}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          {d.notes && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 16, marginBottom: 0 }}>
              <strong>{tx.notes}:</strong> {d.notes}
            </p>
          )}
        </div>

        {isInKind && items.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Package size={20} color="var(--terracotta)" />
              <h2 style={{ fontSize: 16, margin: 0, color: 'var(--navy)' }}>{tx.inKindItems}</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{tx.lineIntro}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {items.map((row, idx) => {
                const q = row.quantity ?? 0
                const u = row.estimatedUnitValue ?? 0
                const uom = row.unitOfMeasure?.trim()
                const qtyLabel = uom ? `${q} (${uom})` : String(q)
                const lines: [string, ReactNode][] = [
                  [tx.item, row.itemName || '—'],
                  [tx.category, row.itemCategory || '—'],
                  [tx.quantity, qtyLabel],
                  [tx.unitValue, formatPHPUnitValue(u)],
                  [tx.intendedUse, row.intendedUse || '—'],
                  [tx.condition, <span key="c" className="badge badge-gray">{row.receivedCondition || '—'}</span>]
                ]
                return (
                  <div
                    key={idx}
                    style={{
                      paddingTop: idx > 0 ? 16 : 0,
                      borderTop: idx > 0 ? '1px solid var(--border)' : undefined
                    }}
                  >
                    {items.length > 1 && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
                        #{idx + 1}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {lines.map(([k, v]) => (
                        <div key={k as string} style={rowStyle}>
                          <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                          <span style={{ fontWeight: 500 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isInKind && items.length === 0 && (
          <div className="card" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {lang === 'tl'
              ? 'Walang nakatalang line item para sa in-kind na donasyong ito.'
              : 'No line items are recorded for this in-kind gift yet.'}
          </div>
        )}
      </div>
    </div>
  )
}
