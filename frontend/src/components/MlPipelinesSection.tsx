import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMlPipelineInsights } from '../lib/api'
import { ML_PIPELINES } from '../data/mlPipelines'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#c1694f', '#6b8f71', '#1e2d4a', '#d4856e', '#4b6c8c', '#a05540']

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${Math.round(n).toLocaleString()}`
}

function formatPipelineError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { detail?: string; message?: string } | undefined
    const server = data?.detail ?? data?.message
    const base = err.message
    return server ? `${base} — ${server}` : base
  }
  if (err instanceof Error) return err.message
  return String(err)
}

type MonthlyPoint = { month: string; total: number; count: number }

type MlBundle = {
  generatedAt: string
  donationForecast: {
    monthly: MonthlyPoint[]
    forecastNextMonthPhp: number | null
    trendSlopePhpPerMonth: number
    monthsUsed: number
    method: string
  }
  riskScoring: {
    byLevel: { level: string; count: number }[]
    highCriticalShare: number
    activeCases: number
    highOrCriticalActive: number
  }
  occupancy: {
    locations: { name: string; capacity: number; current: number; utilizationPercent: number }[]
    avgUtilization: number
  }
  donorChurn: {
    monetarySupportersActive: number
    withMonetaryDonations: number
    activeLast90Days: number
    lapsing: number
    neverDonated: number
    recentMonthly: MonthlyPoint[]
  }
}

function PipelinePreview({ pipelineId, data }: { pipelineId: string; data: MlBundle | undefined }) {
  const h = 320

  if (!data) {
    return (
      <div className="empty-state" style={{ minHeight: h, justifyContent: 'center', padding: 32 }}>
        <p>Loading pipeline output…</p>
      </div>
    )
  }

  if (pipelineId === 'donation-forecast') {
    const fc = data.donationForecast
    const months = fc.monthly ?? []
    const n = months.length
    const ys = months.map((m) => Number(m.total))
    const meanY = n > 0 ? ys.reduce((a, b) => a + b, 0) / n : 0
    const meanX = n > 0 ? (n - 1) / 2 : 0
    const slope = Number(fc.trendSlopePhpPerMonth)
    const intercept = meanY - slope * meanX
    const pts = months.map((m, idx) => ({
      label: m.month?.slice(5) ?? m.month,
      actualK: Math.round(Number(m.total) / 1000),
      trendK: Math.max(0, Math.round((intercept + slope * idx) / 1000)),
    }))

    if (pts.length === 0) {
      return (
        <div className="empty-state" style={{ minHeight: h, padding: 24 }}>
          <p>No monetary donations with dates in Supabase yet.</p>
        </div>
      )
    }

    return (
      <div style={{ padding: '8px 0' }}>
        <ResponsiveContainer width="100%" height={h}>
          <ComposedChart data={pts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}K`} />
            <Tooltip
              formatter={(v, name) =>
                name === 'actualK'
                  ? [`₱${Number(v)}K`, 'Actual']
                  : [`₱${Number(v)}K`, 'Trend (OLS)']
              }
            />
            <Legend />
            <Bar dataKey="actualK" name="Actual (₱K)" fill="var(--terracotta)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="trendK" name="Trend (₱K)" stroke="var(--navy)" strokeWidth={2} dot />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
          <strong>Next month (linear forecast):</strong>{' '}
          {fc.forecastNextMonthPhp != null ? formatPHP(Number(fc.forecastNextMonthPhp)) : '—'} ·{' '}
          <strong>Slope:</strong> {formatPHP(Number(fc.trendSlopePhpPerMonth))}/mo ·{' '}
          <strong>Months used:</strong> {fc.monthsUsed} · <span style={{ fontSize: 12 }}>{fc.method}</span>
        </div>
      </div>
    )
  }

  if (pipelineId === 'risk-scoring') {
    const rs = data.riskScoring
    const pieData = (rs.byLevel ?? []).map((x) => ({ name: x.level, value: x.count }))
    if (pieData.length === 0) {
      return (
        <div className="empty-state" style={{ minHeight: h, padding: 24 }}>
          <p>No active residents in Supabase yet.</p>
        </div>
      )
    }
    return (
      <div style={{ padding: '8px 0' }}>
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          Active cases: <strong>{rs.activeCases}</strong> · High/Critical: <strong>{rs.highOrCriticalActive}</strong> (
          {Math.round((rs.highCriticalShare ?? 0) * 100)}% of active)
        </div>
      </div>
    )
  }

  if (pipelineId === 'occupancy') {
    const loc = data.occupancy.locations ?? []
    const chartData = loc.map((l) => ({
      name: l.name.length > 18 ? `${l.name.slice(0, 16)}…` : l.name,
      utilization: l.utilizationPercent,
      current: l.current,
      capacity: l.capacity,
    }))
    if (chartData.length === 0) {
      return (
        <div className="empty-state" style={{ minHeight: h, padding: 24 }}>
          <p>No active safehouses in Supabase yet.</p>
        </div>
      )
    }
    return (
      <div style={{ padding: '8px 0' }}>
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v) => [`${Number(v)}%`, 'Utilization']}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { current?: number; capacity?: number }
                return p ? `Occupancy ${p.current ?? '—'} / ${p.capacity ?? '—'}` : ''
              }}
            />
            <Bar dataKey="utilization" fill="var(--sage)" name="Utilization %" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          Average utilization: <strong>{data.occupancy.avgUtilization}%</strong>
        </div>
      </div>
    )
  }

  if (pipelineId === 'donor-churn') {
    const d = data.donorChurn
    const summary = [
      { name: 'Active (90d)', value: d.activeLast90Days },
      { name: 'Lapsing', value: d.lapsing },
      { name: 'Never donated', value: d.neverDonated },
    ]
    const recent = (d.recentMonthly ?? []).map((m) => ({
      label: m.month?.slice(5) ?? m.month,
      totalK: Math.round(Number(m.total) / 1000),
    }))

    return (
      <div style={{ padding: '8px 0' }}>
        <ResponsiveContainer width="100%" height={Math.min(200, h * 0.55)}>
          <BarChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--terracotta)" name="Supporters" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '12px 0' }}>
          Monetary supporters (active): <strong>{d.monetarySupportersActive}</strong> · With donations:{' '}
          <strong>{d.withMonetaryDonations}</strong>
        </p>
        {recent.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.min(160, h * 0.45)}>
            <BarChart data={recent}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}K`} />
              <Tooltip formatter={(v) => [`₱${Number(v)}K`, 'Monetary']} />
              <Bar dataKey="totalK" fill="#4b6c8c" name="Last 6 mo (₱K)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No monetary donations in the last six months.</p>
        )}
      </div>
    )
  }

  return null
}

export default function MlPipelinesSection() {
  const n = ML_PIPELINES.length
  const [pipelineIndex, setPipelineIndex] = useState(0)
  const current = ML_PIPELINES[pipelineIndex]

  const { data, isError, error } = useQuery({ queryKey: ['analytics-ml-pipelines'], queryFn: getMlPipelineInsights })

  const goPrev = () => setPipelineIndex((i) => (i - 1 + n) % n)
  const goNext = () => setPipelineIndex((i) => (i + 1) % n)

  const previewHeight = 380

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>ML pipelines (Supabase)</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, maxWidth: 800 }}>
        Each view runs on the server against your live Open Arms tables (donations, residents, safehouses, supporters):
        monthly donation forecast (linear trend), active resident risk mix, safehouse utilization, and donor recency (90-day
        window).
      </p>

      {data?.generatedAt && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Output generated: {new Date(data.generatedAt).toLocaleString()}
        </p>
      )}

      {isError && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            background: '#fef2f2',
            color: '#991b1b',
            fontSize: 13,
          }}
        >
          <p style={{ margin: 0 }}>Could not load pipeline data. {formatPipelineError(error)}</p>
          {axios.isAxiosError(error) && (error.response?.status === 502 || error.code === 'ECONNREFUSED') && (
            <p style={{ margin: '10px 0 0', fontSize: 12, opacity: 0.95 }}>
              The dev server could not get a response from the API. Start the backend from the <code>backend</code>{' '}
              folder (<code>dotnet run</code>), default URL <code>http://localhost:8082</code>. If you use another port,
              set <code>BACKEND_PORT</code> before <code>npm run dev</code> so Vite&apos;s proxy matches.
            </p>
          )}
        </div>
      )}

      <div
        style={{
          minHeight: previewHeight,
          marginBottom: 20,
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: '#fafafa',
          padding: '12px 16px 20px',
        }}
      >
        <h4 style={{ fontSize: 15, marginBottom: 4, fontFamily: 'Playfair Display, serif' }}>{current.title}</h4>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{current.description}</p>
        <PipelinePreview pipelineId={current.id} data={data as MlBundle | undefined} />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          paddingTop: 4,
          borderTop: '1px solid var(--border)',
        }}
      >
        <button type="button" className="btn btn-outline btn-sm" onClick={goPrev} aria-label="Previous pipeline">
          <ChevronLeft size={18} /> Prev
        </button>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            minWidth: 200,
          }}
        >
          {ML_PIPELINES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`btn btn-sm ${i === pipelineIndex ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPipelineIndex(i)}
            >
              {p.title}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={goNext} aria-label="Next pipeline">
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
