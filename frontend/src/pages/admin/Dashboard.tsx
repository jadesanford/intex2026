import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getDashboardAnalytics, getDonations, getAtRiskResidents } from '../../lib/api'
import StatCard from '../../components/StatCard'
import { Users, Building2, AlertTriangle, Heart, TrendingUp } from 'lucide-react'

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

const RISK_BADGE: Record<string, string> = {
  Critical: 'badge badge-red', High: 'badge badge-orange',
  Medium: 'badge badge-yellow', Low: 'badge badge-green'
}

type AtRiskRow = {
  residentId: number; caseControlNo: string; internalCode: string;
  currentRiskLevel: string; caseStatus: string; safehouses?: { name: string; city: string }
}

type DonationRow = {
  donationId: number; amount: number; donationDate: string;
  supporters?: { displayName: string; organizationName: string }; campaignName: string
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
          <StatCard label="Reintegrated" value={dash.residents.reintegrationCompleted} sub="completed reintegration" icon={<Heart size={22} />} color="var(--sage)" />
          <StatCard label="This Month" value={formatPHP(dash.donations.thisMonth)} sub={`${dash.donations.count} total records`} icon={<TrendingUp size={22} />} color="#1e2d4a" />
          <StatCard label="High Risk Cases" value={dash.residents.highRisk} sub={`${dash.residents.critical} critical`} icon={<AlertTriangle size={22} />} color={dash.residents.critical > 0 ? 'var(--danger)' : 'var(--warning)'} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* At-Risk Residents */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18 }}>High-Risk Cases</h2>
            <Link to="/admin/residents" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {!atRisk || atRisk.length === 0 ? (
            <div className="empty-state"><p>No high-risk cases at this time.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {atRisk.slice(0, 6).map((r: AtRiskRow) => (
                <div key={r.residentId} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: '#fafafa', borderRadius: 8
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'monospace' }}>{r.caseControlNo || r.internalCode || `#${r.residentId}`}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.safehouses?.name || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={RISK_BADGE[r.currentRiskLevel] || 'badge badge-gray'}>{r.currentRiskLevel}</span>
                    <Link to={`/admin/residents/${r.residentId}`} style={{ fontSize: 12, color: 'var(--terracotta)' }}>View →</Link>
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
              {recentDonations.slice(0, 6).map((d: DonationRow) => {
                const donorName = d.supporters?.displayName || d.supporters?.organizationName || 'Anonymous'
                return (
                  <div key={d.donationId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fafafa', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{donorName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {d.donationDate?.slice(0, 10)} {d.campaignName ? `· ${d.campaignName}` : ''}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--sage)' }}>{formatPHP(d.amount || 0)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {dash && (
        <div className="grid-3" style={{ marginTop: 24 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--terracotta)', fontFamily: 'Playfair Display, serif' }}>{dash.safehouses.total}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Active Safehouses</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {dash.safehouses.totalOccupancy} / {dash.safehouses.totalCapacityGirls} capacity used
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--warning)', fontFamily: 'Playfair Display, serif' }}>{dash.incidents.unresolved}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Unresolved Incidents</div>
            <div style={{ fontSize: 13, marginTop: 4, color: dash.incidents.high > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {dash.incidents.high} high severity
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--sage)', fontFamily: 'Playfair Display, serif' }}>{dash.supporters.active}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Active Supporters</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{dash.supporters.monetary} donors · {dash.supporters.volunteers} volunteers</div>
          </div>
        </div>
      )}
    </div>
  )
}
