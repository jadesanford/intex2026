// @ts-nocheck
import { useQuery } from '@tanstack/react-query'
import { getDashboardAnalytics, getSafehouseComparison, getAnalyticsDonationTrends, getResidentOutcomes } from '../../lib/api'
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#c1694f', '#6b8f71', '#1e2d4a', '#d4856e', '#4b6c8c', '#a05540']

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

export default function Analytics() {
  const { data: dash } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardAnalytics })
  const { data: comparison } = useQuery({ queryKey: ['safehouse-comparison'], queryFn: getSafehouseComparison })
  const { data: donationTrends } = useQuery({ queryKey: ['analytics-donation-trends'], queryFn: getAnalyticsDonationTrends })
  const { data: outcomes } = useQuery({ queryKey: ['resident-outcomes'], queryFn: getResidentOutcomes })

  const trendData = (donationTrends?.monthly ?? []).map((t: { month: string; total: number; count: number }) => ({
    month: t.month?.slice(5), total: Math.round(t.total / 1_000), count: t.count
  }))

  const outcomeData = (outcomes?.byStatus ?? []).map((s: { name: string; value: number }) => ({
    name: s.name, value: s.value
  }))

  const categoryData = (outcomes?.byCategory ?? []).map((c: { name: string; value: number }) => ({
    name: c.name || 'Unknown', count: c.value
  }))

  const safehouseData = (comparison ?? []).map((s: { name: string; currentOccupancy: number; capacityGirls: number; active: number }) => ({
    name: s.name?.split(' ').slice(-1)[0], current: s.currentOccupancy, capacity: s.capacityGirls, active: s.active
  }))

  const reintegrationRate = dash && dash.residents.total > 0
    ? Math.round((dash.residents.reintegrationCompleted / dash.residents.total) * 100)
    : 0

  const avgOccupancy = comparison && comparison.length > 0
    ? Math.round(comparison.reduce((a: number, s: { occupancyRate: number }) => a + (s.occupancyRate || 0), 0) / comparison.length)
    : 0

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 28 }}>Analytics & Insights</h1>
      </div>

      {dash && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Residents', value: dash.residents.total, color: 'var(--terracotta)' },
            { label: 'Reintegration Rate', value: `${reintegrationRate}%`, color: 'var(--sage)' },
            { label: 'Avg Safehouse Occupancy', value: `${avgOccupancy}%`, color: 'var(--navy)' },
            { label: 'Total Monetary Raised', value: formatPHP(dash.donations.total || 0), color: '#d4856e' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'Playfair Display, serif' }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Donation Trend (₱ Thousands)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${v}K`} />
              <Tooltip formatter={(v: number) => [`₱${v}K`, 'Total']} />
              <Area type="monotone" dataKey="total" stroke="var(--terracotta)" fill="rgba(193,105,79,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Resident Status Distribution</h3>
          {outcomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={outcomeData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {outcomeData.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Safehouse Capacity vs. Current Occupancy</h3>
          {safehouseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={safehouseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="capacity" fill="rgba(193,105,79,0.2)" name="Capacity (Girls)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill="var(--terracotta)" name="Current Occupancy" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Cases by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--sage)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
        </div>
      </div>

      {dash && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Risk & Outcome Overview</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Critical Risk', count: dash.residents.critical, color: 'var(--danger)' },
              { label: 'High Risk', count: dash.residents.highRisk - dash.residents.critical, color: 'var(--warning)' },
              { label: 'Active Cases', count: dash.residents.active, color: 'var(--info)' },
              { label: 'Reintegration In Progress', count: dash.residents.reintegrationInProgress, color: '#6b8f71' },
              { label: 'Reintegrated', count: dash.residents.reintegrationCompleted, color: 'var(--success)' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: 16, borderRadius: 10, background: '#fafafa' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color, fontFamily: 'Playfair Display, serif' }}>{count ?? 0}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-category breakdown */}
      {outcomes?.subCategories && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Sub-Category Breakdown</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Trafficked', count: outcomes.subCategories.trafficked },
              { label: 'Sexual Abuse', count: outcomes.subCategories.sexualAbuse },
              { label: 'Physical Abuse', count: outcomes.subCategories.physicalAbuse },
              { label: 'OSAEC/CSAEM', count: outcomes.subCategories.osaec },
            ].map(({ label, count }) => (
              <div key={label} style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: 16, borderRadius: 10, background: '#fafafa', borderLeft: '3px solid var(--terracotta)' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--terracotta)' }}>{count ?? 0}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
