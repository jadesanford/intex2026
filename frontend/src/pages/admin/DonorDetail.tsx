import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSupporter } from '../../lib/api'
import { ArrowLeft } from 'lucide-react'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

type DonationRow = {
  donationId: number; donationDate: string; amount: number; estimatedValue: number;
  donationType: string; campaignName: string; channelSource: string; isRecurring: boolean
}

export default function DonorDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useQuery({ queryKey: ['supporter', +id!], queryFn: () => getSupporter(+id!) })

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>
  if (!data) return <div>Supporter not found.</div>

  const { supporter: s, donations } = data
  const name = s.displayName || s.organizationName || `${s.firstName || ''} ${s.lastName || ''}`.trim()
  const monetary = (donations ?? []).filter((d: DonationRow) => d.donationType === 'Monetary')
  const total = monetary.reduce((sum: number, d: DonationRow) => sum + (d.amount || 0), 0)

  const byChannel = (donations ?? []).reduce((acc: Record<string, number>, d: DonationRow) => {
    const ch = d.channelSource || 'Unknown'
    acc[ch] = (acc[ch] || 0) + (d.amount || 0)
    return acc
  }, {})

  return (
    <div>
      <Link to="/admin/donors" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
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
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>{formatPHP(total)}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total monetary contributions</div>
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
              ['Acquisition Channel', s.acquisitionChannel || '—'],
              ['First Donation', s.firstDonationDate || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
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
              ['Last Gift', monetary[0]?.donationDate?.slice(0, 10) || 'None'],
            ].map(([k, v]) => (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          {Object.keys(byChannel).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>By Channel</div>
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
            <thead><tr><th>Date</th><th>Amount</th><th>Type</th><th>Campaign</th><th>Channel</th><th>Recurring</th></tr></thead>
            <tbody>
              {(donations ?? []).map((d: DonationRow) => (
                <tr key={d.donationId}>
                  <td>{d.donationDate?.slice(0, 10)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--sage)' }}>
                    {d.donationType === 'Monetary' ? formatPHP(d.amount || 0) : `₱${d.estimatedValue?.toLocaleString() || 0} est.`}
                  </td>
                  <td><span className={d.donationType === 'Monetary' ? 'badge badge-green' : 'badge badge-blue'}>{d.donationType}</span></td>
                  <td style={{ fontSize: 13 }}>{d.campaignName || '—'}</td>
                  <td style={{ fontSize: 13 }}>{d.channelSource || '—'}</td>
                  <td>{d.isRecurring ? <span style={{ color: 'var(--success)' }}>✓</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
