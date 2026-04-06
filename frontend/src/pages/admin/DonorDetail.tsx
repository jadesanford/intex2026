import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSupporter } from '../../lib/api'
import { ArrowLeft, DollarSign } from 'lucide-react'

function formatIDR(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}M`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function DonorDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useQuery({ queryKey: ['supporter', +id!], queryFn: () => getSupporter(+id!) })

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>
  if (!data) return <div>Supporter not found.</div>

  const { supporter: s, donations } = data
  const total = (donations ?? []).reduce((sum: number, d: { amount: number }) => sum + (d.amount || 0), 0)
  const byChannel = (donations ?? []).reduce((acc: Record<string, number>, d: { channel: string; amount: number }) => {
    acc[d.channel || 'unknown'] = (acc[d.channel || 'unknown'] || 0) + (d.amount || 0)
    return acc
  }, {})

  return (
    <div>
      <Link to="/admin/donors" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Donors
      </Link>

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>{s.name}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span className="badge badge-blue">{s.type}</span>
            <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
            {s.isRecurring && <span className="badge badge-purple">Recurring</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>{formatIDR(total)}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total contributed</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Contact Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Email', s.email || '—'], ['Phone', s.phone || '—'], ['City', s.city || '—'], ['Country', s.country || '—']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            {s.notes && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>{s.notes}</div>}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Giving Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Total Donations', (donations ?? []).length], ['Total Amount', formatIDR(total)],
              ['Avg Gift', formatIDR(total / Math.max(1, (donations ?? []).length))],
              ['Last Gift', donations?.[0]?.donatedAt?.slice(0, 10) || 'None']
            ].map(([k, v]) => (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>By Channel</div>
            {Object.entries(byChannel).map(([ch, amt]) => (
              <div key={ch} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ textTransform: 'capitalize' }}>{ch}</span>
                <span style={{ fontWeight: 500 }}>{formatIDR(amt as number)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16 }}>Donation History</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Date</th><th>Amount</th><th>Type</th><th>Campaign</th><th>Channel</th><th>Receipt</th></tr></thead>
            <tbody>
              {(donations ?? []).map((d: { id: number; donatedAt: string; amount: number; donationType: string; campaign: string; channel: string; receiptIssued: boolean }) => (
                <tr key={d.id}>
                  <td>{d.donatedAt?.slice(0, 10)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--sage)' }}>{formatIDR(d.amount || 0)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{d.donationType}</td>
                  <td>{d.campaign || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{d.channel || '—'}</td>
                  <td>{d.receiptIssued ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
