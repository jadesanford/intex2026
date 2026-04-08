import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardAnalytics, getSafehouseComparison, getAnalyticsDonationTrends, getResidentOutcomes } from '../../lib/api'
import {
  DEMO_DASHBOARD,
  DEMO_DONATION_MONTHLY,
  DEMO_RESIDENT_BY_CATEGORY,
  DEMO_RESIDENT_BY_STATUS,
  DEMO_SAFEHOUSE_COMPARISON,
  DEMO_SUB_CATEGORIES,
} from '../../data/analyticsDemo'
import MlPipelinesSection from '../../components/MlPipelinesSection'
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#c1694f', '#6b8f71', '#1e2d4a', '#d4856e', '#4b6c8c', '#a05540']
const RADIAN = Math.PI / 180

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

export default function Analytics() {
  const { data: dash, isFetched: dashFetched } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardAnalytics })
  const { data: comparison, isFetched: compFetched } = useQuery({ queryKey: ['safehouse-comparison'], queryFn: getSafehouseComparison })
  const { data: donationTrends, isFetched: trendsFetched } = useQuery({
    queryKey: ['analytics-donation-trends'],
    queryFn: getAnalyticsDonationTrends,
  })
  const { data: outcomes, isFetched: outcomesFetched } = useQuery({ queryKey: ['resident-outcomes'], queryFn: getResidentOutcomes })

  const useDemoTrends = trendsFetched && !(donationTrends?.monthly?.length)
  const useDemoComparison = compFetched && !(comparison?.length)
  const useDemoOutcomes = outcomesFetched && !(outcomes?.byStatus?.length)
  const useDemoDash =
    dashFetched &&
    dash &&
    dash.residents.total === 0 &&
    (dash.donations.total ?? 0) === 0

  const showingSampleData = useDemoTrends || useDemoComparison || useDemoOutcomes || useDemoDash

  const displayDash = useMemo(() => {
    if (!dash) return null
    if (!useDemoDash) return dash
    return { ...dash, residents: DEMO_DASHBOARD.residents, donations: DEMO_DASHBOARD.donations }
  }, [dash, useDemoDash])

  const monthlySource = useDemoTrends ? DEMO_DONATION_MONTHLY : (donationTrends?.monthly ?? [])
  const trendData = monthlySource.map((t: { month: string; total: number; count: number }) => ({
    month: t.month?.slice(5),
    total: Math.round(t.total / 1_000),
    count: t.count,
  }))

  const statusSource = useDemoOutcomes ? DEMO_RESIDENT_BY_STATUS : (outcomes?.byStatus ?? [])
  const outcomeData = statusSource.map((s: { name: string; value: number }) => ({
    name: s.name ?? 'Unknown',
    value: s.value,
  }))

  const categorySource = useDemoOutcomes ? DEMO_RESIDENT_BY_CATEGORY : (outcomes?.byCategory ?? [])
  const categoryData = categorySource.map((c: { name: string; value: number }) => ({
    name: c.name || 'Unknown',
    count: c.value,
  }))

  const comparisonRows = useDemoComparison ? DEMO_SAFEHOUSE_COMPARISON : (comparison ?? [])
  const safehouseData = comparisonRows.map((s: { name: string; currentOccupancy: number; capacityGirls: number; active: number }) => ({
    name: s.name?.split(' ').slice(-1)[0],
    current: s.currentOccupancy,
    capacity: s.capacityGirls,
    active: s.active,
  }))

  const subCategories = useDemoOutcomes ? DEMO_SUB_CATEGORIES : outcomes?.subCategories

  const reintegrationRate =
    displayDash && displayDash.residents.total > 0
      ? Math.round((displayDash.residents.reintegrationCompleted / displayDash.residents.total) * 100)
      : 0

  const avgOccupancy =
    comparisonRows.length > 0
      ? Math.round(
          comparisonRows.reduce((a: number, s: { occupancyRate?: number }) => a + (s.occupancyRate || 0), 0) /
            comparisonRows.length,
        )
      : 0

  const renderOutcomeLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    name
  }: {
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
    name?: string
  }) => {
    const centerX = cx ?? 0
    const centerY = cy ?? 0
    const angle = midAngle ?? 0
    const inner = innerRadius ?? 0
    const outer = outerRadius ?? 0
    const radius = inner + (outer - inner) * 0.55
    const x = centerX + radius * Math.cos(-angle * RADIAN)
    const y = centerY + radius * Math.sin(-angle * RADIAN)

    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 600 }}>
        {name ?? ''}
      </text>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 28 }}>Analytics & Insights</h1>
      </div>

      {showingSampleData && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: '#fffbeb',
            borderColor: '#fcd34d',
            fontSize: 13,
            color: '#92400e',
          }}
        >
          Sample data is shown because the database returned no residents, donations, or safehouses yet. Figures will
          switch to live data automatically once records exist.
        </div>
      )}

      {displayDash && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Residents', value: displayDash.residents.total, color: 'var(--terracotta)' },
            { label: 'Reintegration Rate', value: `${reintegrationRate}%`, color: 'var(--sage)' },
            { label: 'Avg Safehouse Occupancy', value: `${avgOccupancy}%`, color: 'var(--navy)' },
            { label: 'Total Monetary Raised', value: formatPHP(displayDash.donations.total || 0), color: '#d4856e' },
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
              <Tooltip formatter={(v) => [`₱${Number(v)}K`, 'Total']} />
              <Area type="monotone" dataKey="total" stroke="var(--terracotta)" fill="rgba(193,105,79,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Resident Status Distribution</h3>
          {outcomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={78}
                  dataKey="value"
                  labelLine={false}
                  label={renderOutcomeLabel}
                >
                  {outcomeData.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>Loading chart data…</p>
            </div>
          )}
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
          ) : (
            <div className="empty-state">
              <p>Loading chart data…</p>
            </div>
          )}
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
          ) : (
            <div className="empty-state">
              <p>Loading chart data…</p>
            </div>
          )}
        </div>
      </div>

      {displayDash && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Risk & Outcome Overview</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Critical Risk', count: displayDash.residents.critical, color: 'var(--danger)' },
              {
                label: 'High Risk',
                count: displayDash.residents.highRisk - displayDash.residents.critical,
                color: 'var(--warning)',
              },
              { label: 'Active Cases', count: displayDash.residents.active, color: 'var(--info)' },
              { label: 'Reintegration In Progress', count: displayDash.residents.reintegrationInProgress, color: '#6b8f71' },
              { label: 'Reintegrated', count: displayDash.residents.reintegrationCompleted, color: 'var(--success)' },
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
      {subCategories && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Sub-Category Breakdown</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Trafficked', count: subCategories.trafficked },
              { label: 'Sexual Abuse', count: subCategories.sexualAbuse },
              { label: 'Physical Abuse', count: subCategories.physicalAbuse },
              { label: 'OSAEC/CSAEM', count: subCategories.osaec },
            ].map(({ label, count }) => (
              <div key={label} style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: 16, borderRadius: 10, background: '#fafafa', borderLeft: '3px solid var(--terracotta)' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--terracotta)' }}>{count ?? 0}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <MlPipelinesSection />
    </div>
  )
}
