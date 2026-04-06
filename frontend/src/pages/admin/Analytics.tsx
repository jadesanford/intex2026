import { useQuery } from '@tanstack/react-query'
import { getDashboardAnalytics, getSafehouseComparison, getAnalyticsDonationTrends, getResidentOutcomes } from '../../lib/api'
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart2 } from 'lucide-react'

const COLORS = ['#c1694f', '#6b8f71', '#1e2d4a', '#d4856e', '#4b6c8c', '#a05540']

function formatIDR(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}M`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function Analytics() {
  const { data: dash } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardAnalytics })
  const { data: comparison } = useQuery({ queryKey: ['safehouse-comparison'], queryFn: getSafehouseComparison })
  const { data: donationTrends } = useQuery({ queryKey: ['analytics-donation-trends'], queryFn: getAnalyticsDonationTrends })
  const { data: outcomes } = useQuery({ queryKey: ['resident-outcomes'], queryFn: getResidentOutcomes })

  const trendData = (donationTrends ?? []).map((t: { month: string; total: number; count: number }) => ({
    month: t.month?.slice(0, 7), total: Math.round(t.total / 1_000_000), count: t.count
  }))

  const outcomeData = (outcomes?.byStatus ?? []).map((s: { status: string; count: number }) => ({
    name: s.status, value: s.count
  }))

  const categoryData = (outcomes?.byCategory ?? []).map((c: { caseCategory: string; count: number }) => ({
    name: c.caseCategory?.replace('_', ' '), count: c.count
  }))

  const safehouseData = (comparison ?? []).map((s: { name: string; currentResidents: number; capacity: number; totalResidents: number }) => ({
    name: s.name?.split(' ').slice(-1)[0], current: s.currentResidents, capacity: s.capacity, total: s.totalResidents
  }))

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 28 }}>Analytics & Insights</h1>
      </div>

      {dash && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Residents', value: dash.residents.total, color: 'var(--terracotta)' },
            { label: 'Reintegration Rate', value: `${dash.residents.total > 0 ? Math.round((dash.residents.reintegrated / dash.residents.total) * 100) : 0}%`, color: 'var(--sage)' },
            { label: 'Avg Safehouse Occupancy', value: `${comparison ? Math.round((comparison as { currentResidents: number; capacity: number }[]).reduce((a, s) => a + (s.capacity > 0 ? s.currentResidents / s.capacity : 0), 0) / Math.max(1, comparison.length) * 100) : 0}%`, color: 'var(--navy)' },
            { label: 'Total Fundraised', value: formatIDR(dash.donations.thisMonth || 0), color: '#d4856e' },
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
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Donation Trend (Rp Millions)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}M`} />
              <Tooltip formatter={(v: number) => [`Rp ${v}M`, 'Total']} />
              <Area type="monotone" dataKey="total" stroke="var(--terracotta)" fill="rgba(193,105,79,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Resident Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={outcomeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                {outcomeData.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Safehouse Capacity vs. Occupancy</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={safehouseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="capacity" fill="rgba(193,105,79,0.2)" name="Capacity" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" fill="var(--terracotta)" name="Current" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Cases by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--sage)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {dash && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Risk Distribution Overview</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Critical', count: dash.residents.critical, color: 'var(--danger)' },
              { label: 'High', count: dash.residents.highRisk, color: 'var(--warning)' },
              { label: 'Active', count: dash.residents.active, color: 'var(--info)' },
              { label: 'Reintegrated', count: dash.residents.reintegrated, color: 'var(--success)' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', padding: 16, borderRadius: 10, background: '#fafafa' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color, fontFamily: 'Playfair Display, serif' }}>{count}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
