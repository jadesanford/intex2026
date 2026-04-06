import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getDashboardAnalytics, getDonations, getAtRiskResidents } from '../../lib/api'
import StatCard from '../../components/StatCard'
import { Users, DollarSign, Building2, AlertTriangle, Heart, TrendingUp } from 'lucide-react'

function formatIDR(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}M`
  return `Rp ${n.toLocaleString('id-ID')}`
}

const RISK_BADGE: Record<string, string> = {
  critical: 'badge badge-red', high: 'badge badge-orange',
  medium: 'badge badge-yellow', low: 'badge badge-green'
}

export default function Dashboard() {
  const { data: dash } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardAnalytics })
  const { data: recentDonations } = useQuery({ queryKey: ['donations', 1], queryFn: () => getDonations({ page: 1, pageSize: 6 }) })
  const { data: atRisk } = useQuery({ queryKey: ['at-risk'], queryFn: getAtRiskResidents })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {dash && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <StatCard label="Active Residents" value={dash.residents.active} sub={`${dash.residents.total} total`} icon={<Users size={22} />} />
          <StatCard label="Reintegrated" value={dash.residents.reintegrated} sub="success stories" icon={<Heart size={22} />} color="var(--sage)" />
          <StatCard label="This Month Donations" value={formatIDR(dash.donations.thisMonth)} sub={`${dash.donations.count} total`} icon={<DollarSign size={22} />} color="#1e2d4a" />
          <StatCard label="High Risk Cases" value={dash.residents.highRisk} sub={`${dash.residents.critical} critical`} icon={<AlertTriangle size={22} />} color={dash.residents.critical > 0 ? 'var(--danger)' : 'var(--warning)'} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* At-Risk Residents */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18 }}>High-Risk Cases</h2>
            <Link to="/admin/residents?riskLevel=high" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {!atRisk || atRisk.length === 0 ? (
            <div className="empty-state"><p>No high-risk cases at this time.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {atRisk.slice(0, 6).map((r: { id: number; caseCode: string; riskLevel: string; status: string; safehouses?: { name: string } }) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: '#fafafa', borderRadius: 8
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.caseCode}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.safehouses?.name || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={RISK_BADGE[r.riskLevel] || 'badge badge-gray'}>{r.riskLevel}</span>
                    <Link to={`/admin/residents/${r.id}`} style={{ fontSize: 12, color: 'var(--terracotta)' }}>View →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Donations */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18 }}>Recent Donations</h2>
            <Link to="/admin/donations" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {!recentDonations || recentDonations.length === 0 ? (
            <div className="empty-state"><p>No donations recorded yet.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentDonations.slice(0, 6).map((d: { id: number; amount: number; currency: string; donatedAt: string; supporters?: { name: string }; campaign: string }) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fafafa', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{d.supporters?.name || 'Anonymous'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.donatedAt?.slice(0, 10)} · {d.campaign}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--sage)' }}>
                    {formatIDR(d.amount || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {dash && (
        <div className="grid-3" style={{ marginTop: 24 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'Playfair Display, serif' }}>{dash.safehouses.total}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Active Safehouses</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Capacity: {dash.safehouses.totalCapacity}</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--warning)', fontFamily: 'Playfair Display, serif' }}>{dash.incidents.unresolved}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Unresolved Incidents</div>
            <div style={{ fontSize: 13, marginTop: 4, color: 'var(--danger)' }}>{dash.incidents.critical} critical</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>{dash.supporters.recurring}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Recurring Donors</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{dash.supporters.total} total supporters</div>
          </div>
        </div>
      )}
    </div>
  )
}
