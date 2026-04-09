import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
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

/** Normalize API aggregates whether server used camelCase or PascalCase. */
function riskBinFromApi(x: { level?: string; Level?: string; count?: number; Count?: number }) {
  return {
    name: x.level ?? x.Level ?? '—',
    value: Number(x.count ?? x.Count ?? 0),
  }
}

function namedValueFromApi(x: { name?: string; Name?: string; value?: number; Value?: number }) {
  return {
    name: x.name ?? x.Name ?? '—',
    value: Number(x.value ?? x.Value ?? 0),
  }
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
  mlTableRowCounts?: {
    donorChurnPredictions: number
    mlCaseEscalationPredictions: number
    mlReintegrationPredictions: number
    mlEducationProgressPredictions: number
    mlHealthAlertPredictions: number
    mlHomeVisitationPredictions: number
    mlInterventionPlanPredictions: number
    mlSafehouseStrainPredictions: number
  }
  predictionSamples?: {
    caseEscalation?: Record<string, unknown>[]
    donorChurn?: Record<string, unknown>[]
    reintegration?: Record<string, unknown>[]
    education?: Record<string, unknown>[]
    health?: Record<string, unknown>[]
    homeVisitation?: Record<string, unknown>[]
    intervention?: Record<string, unknown>[]
    safehouseStrain?: Record<string, unknown>[]
  }
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
    locations: {
      name: string
      capacity: number
      current: number
      utilizationPercent: number
      strainProbabilityPercent?: number | null
      strainForecastValue?: number | null
    }[]
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
  caseEscalationRisk: {
    byLevel: { level: string; count: number }[]
    highCriticalShare: number
    activeCases: number
    highOrCriticalActive: number
  }
  safehouseCapacityStrainForecast: {
    locations: {
      name: string
      capacity: number
      current: number
      utilizationPercent: number
      strainProbabilityPercent?: number | null
      strainForecastValue?: number | null
    }[]
    avgUtilization: number
  }
  donorChurnPrediction: {
    monetarySupportersActive: number
    withMonetaryDonations: number
    activeLast90Days: number
    lapsing: number
    neverDonated: number
    recentMonthly: MonthlyPoint[]
    /** Counts by model risk_level when donor_churn_predictions has rows */
    modelRiskByLevel?: { name: string; value: number }[] | null
  }
  reintegrationReadiness: {
    byStatus: { name: string; value: number }[]
    completed: number
    readinessRate: number
  }
  educationProgressForecast: {
    monthly: { month: string; avgProgress: number; count: number }[]
  }
  healthDeteriorationAlert: {
    lowHealthCount: number
    checkupGapCount: number
    byBand: { name: string; value: number }[]
  }
  homeVisitationFollowupPrioritization: {
    followUpNeeded: number
    safetyConcerns: number
    byOutcome: { name: string; value: number }[]
  }
  interventionPlanCompletionRisk: {
    openPlans: number
    overdueOpenPlans: number
    byStatus: { name: string; value: number }[]
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

  if (pipelineId === 'case-escalation-risk') {
    const rs = data.caseEscalationRisk ?? data.riskScoring
    const pieData = (rs.byLevel ?? []).map((x) => riskBinFromApi(x as { level?: string; Level?: string; count?: number; Count?: number }))
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

  if (pipelineId === 'safehouse-capacity-strain-forecast') {
    const occ = data.safehouseCapacityStrainForecast ?? data.occupancy
    const loc = occ.locations ?? []
    const showStrainBars = loc.some((l) => l.strainProbabilityPercent != null)
    const chartData = loc.map((l) => ({
      name: l.name.length > 18 ? `${l.name.slice(0, 16)}…` : l.name,
      utilization: l.utilizationPercent,
      strainRisk: l.strainProbabilityPercent ?? 0,
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
              formatter={(v, name) => [`${Number(v)}%`, name === 'utilization' ? 'Utilization (incl. model blend)' : 'Strain probability (model)']}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { current?: number; capacity?: number }
                return p ? `Occupancy ${p.current ?? '—'} / ${p.capacity ?? '—'}` : ''
              }}
            />
            <Legend />
            <Bar dataKey="utilization" fill="var(--sage)" name="Utilization %" radius={[0, 4, 4, 0]} />
            {showStrainBars ? (
              <Bar dataKey="strainRisk" fill="#4b6c8c" name="Strain p×100 (joblib)" radius={[0, 4, 4, 0]} />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          Average utilization: <strong>{occ.avgUtilization}%</strong>
          {showStrainBars ? (
            <span>
              {' '}
              · Bars include <strong>strain classifier/regressor</strong> outputs from{' '}
              <code>ml_safehouse_strain_predictions</code>
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  if (pipelineId === 'donor-churn-prediction') {
    const d = data.donorChurnPrediction ?? data.donorChurn
    const heuristicSummary = [
      { name: 'Active (90d)', value: d.activeLast90Days },
      { name: 'Lapsing', value: d.lapsing },
      { name: 'Never donated', value: d.neverDonated },
    ]
    const modelMix = 'modelRiskByLevel' in d ? d.modelRiskByLevel : null
    const summary =
      modelMix && modelMix.length > 0
        ? modelMix.map((x) =>
            namedValueFromApi(x as { name?: string; Name?: string; value?: number; Value?: number }),
          )
        : heuristicSummary
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
          {modelMix && modelMix.length > 0 ? (
            <span>
              {' '}
              · <strong>Bar chart:</strong> counts from <code>donor_churn_predictions</code> risk levels
            </span>
          ) : null}
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

  if (pipelineId === 'reintegration-readiness') {
    const rr = data.reintegrationReadiness
    const bars = (rr?.byStatus ?? []).map((x) =>
      namedValueFromApi(x as { name?: string; Name?: string; value?: number; Value?: number }),
    )
    return (
      <div style={{ padding: '8px 0' }}>
        <ResponsiveContainer width="100%" height={Math.min(220, h * 0.6)}>
          <BarChart data={bars}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--sage)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          Completed reintegration: <strong>{rr?.completed ?? 0}</strong> · Readiness rate:{' '}
          <strong>{Math.round(rr?.readinessRate ?? 0)}%</strong>
        </p>
      </div>
    )
  }

  if (pipelineId === 'education-progress-forecast') {
    const monthly = (data.educationProgressForecast?.monthly ?? []).map((m) => {
      const raw = m as { month?: string; Month?: string; avgProgress?: number; AvgProgress?: number; count?: number; Count?: number }
      const mo = raw.month ?? raw.Month ?? ''
      return {
        label: mo.length >= 7 ? mo.slice(5) : mo,
        avgProgress: raw.avgProgress ?? raw.AvgProgress ?? 0,
        count: raw.count ?? raw.Count ?? 0,
      }
    })
    if (monthly.length === 0) {
      return <div className="empty-state" style={{ minHeight: h, padding: 24 }}><p>No education records yet.</p></div>
    }
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ComposedChart data={monthly}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="avgProgress" stroke="var(--navy)" name="Avg progress %" strokeWidth={2} />
          <Bar yAxisId="right" dataKey="count" fill="var(--terracotta)" name="Records" radius={[4, 4, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>
    )
  }

  if (pipelineId === 'health-deterioration-alert') {
    const health = data.healthDeteriorationAlert
    const summary = [
      { name: 'Low health', value: health?.lowHealthCount ?? 0 },
      { name: 'Checkup gaps', value: health?.checkupGapCount ?? 0 },
    ]
    const bands = (health?.byBand ?? []).map((x) =>
      namedValueFromApi(x as { name?: string; Name?: string; value?: number; Value?: number }),
    )
    return (
      <div style={{ padding: '8px 0' }}>
        <ResponsiveContainer width="100%" height={Math.min(180, h * 0.5)}>
          <BarChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#d4856e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={Math.min(170, h * 0.45)}>
          <PieChart>
            <Pie data={bands} dataKey="value" nameKey="name" outerRadius={70} label>
              {bands.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (pipelineId === 'home-visitation-followup-prioritization') {
    const v = data.homeVisitationFollowupPrioritization
    const outcome = (v?.byOutcome ?? []).map((x) =>
      namedValueFromApi(x as { name?: string; Name?: string; value?: number; Value?: number }),
    )
    return (
      <div style={{ padding: '8px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Follow-up needed: <strong>{v?.followUpNeeded ?? 0}</strong> · Safety concerns:{' '}
          <strong>{v?.safetyConcerns ?? 0}</strong>
        </p>
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={outcome} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#4b6c8c" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (pipelineId === 'intervention-plan-completion-risk') {
    const p = data.interventionPlanCompletionRisk
    return (
      <div style={{ padding: '8px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Open plans: <strong>{p?.openPlans ?? 0}</strong> · Overdue open plans:{' '}
          <strong>{p?.overdueOpenPlans ?? 0}</strong>
        </p>
        <ResponsiveContainer width="100%" height={h}>
          <BarChart
            data={(p?.byStatus ?? []).map((x) =>
              namedValueFromApi(x as { name?: string; Name?: string; value?: number; Value?: number }),
            )}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="var(--terracotta)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}

function formatSampleCell(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '—'
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

function sampleRowsForPipeline(
  pipelineId: string,
  samples: MlBundle['predictionSamples'] | undefined,
): Record<string, unknown>[] {
  if (!samples) return []
  const map: Record<string, Record<string, unknown>[] | undefined> = {
    'case-escalation-risk': samples.caseEscalation,
    'donor-churn-prediction': samples.donorChurn,
    'reintegration-readiness': samples.reintegration,
    'education-progress-forecast': samples.education,
    'health-deterioration-alert': samples.health,
    'home-visitation-followup-prioritization': samples.homeVisitation,
    'intervention-plan-completion-risk': samples.intervention,
    'safehouse-capacity-strain-forecast': samples.safehouseStrain,
  }
  return map[pipelineId] ?? []
}

function MlSampleTable({
  pipelineId,
  samples,
}: {
  pipelineId: string
  samples: MlBundle['predictionSamples'] | undefined
}) {
  const rows = sampleRowsForPipeline(pipelineId, samples)
  if (rows.length === 0) {
    return (
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          No sample rows for this pipeline — if counts above are zero, run <code>ml-pipelines/jobs/run_all.py</code> and
          confirm Supabase tables exist and RLS allows the service role to read them.
        </p>
      </div>
    )
  }
  const keys = Object.keys(rows[0]!)
  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
        Inference preview (up to {rows.length} rows)
      </p>
      <div
        style={{
          overflowX: 'auto',
          maxHeight: 240,
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'white',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {keys.map((k) => (
                <th
                  key={k}
                  style={{
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    background: '#f0f0f0',
                  }}
                >
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 ? '#fafafa' : 'white' }}>
                {keys.map((k) => (
                  <td
                    key={k}
                    style={{ padding: '6px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}
                  >
                    {formatSampleCell(row[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function MlPipelinesSection() {
  const [pipelineIndex, setPipelineIndex] = useState(0)
  const current = ML_PIPELINES[pipelineIndex]

  const { data, isError, error } = useQuery({ queryKey: ['analytics-ml-pipelines'], queryFn: getMlPipelineInsights })

  const previewHeight = 380

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>ML pipelines (joblib → database)</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, maxWidth: 800 }}>
        Each tab charts rows produced by <code>run_all.py</code> from your <code>artifacts/*.joblib</code> models (tables{' '}
        <code>ml_*</code>, <code>donor_churn_predictions</code>). Donation trend stays an OLS forecast on donations (no
        donation model artifact). If a prediction table is empty, that tab falls back to raw Supabase fields similar to
        exploratory notebook plots.
      </p>

      {data?.generatedAt && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Output generated: {new Date(data.generatedAt).toLocaleString()}
        </p>
      )}

      {data?.mlTableRowCounts && !isError && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginBottom: 14,
            lineHeight: 1.65,
            padding: '10px 12px',
            background: '#f7f7f7',
            borderRadius: 8,
            border: '1px solid var(--border)',
          }}
        >
          <strong style={{ color: 'var(--text)' }}>Rows read from prediction tables:</strong>{' '}
          <code>donor_churn_predictions</code> {data.mlTableRowCounts.donorChurnPredictions},{' '}
          <code>ml_case_escalation_predictions</code> {data.mlTableRowCounts.mlCaseEscalationPredictions},{' '}
          <code>ml_reintegration_predictions</code> {data.mlTableRowCounts.mlReintegrationPredictions},{' '}
          <code>ml_education_progress_predictions</code> {data.mlTableRowCounts.mlEducationProgressPredictions},{' '}
          <code>ml_health_alert_predictions</code> {data.mlTableRowCounts.mlHealthAlertPredictions},{' '}
          <code>ml_home_visitation_predictions</code> {data.mlTableRowCounts.mlHomeVisitationPredictions},{' '}
          <code>ml_intervention_plan_predictions</code> {data.mlTableRowCounts.mlInterventionPlanPredictions},{' '}
          <code>ml_safehouse_strain_predictions</code> {data.mlTableRowCounts.mlSafehouseStrainPredictions}.
        </div>
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
              folder (<code>dotnet run</code>), default URL <code>http://localhost:5215</code>. If you use another port,
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
          background: 'var(--surface-2)',
          padding: '12px 16px 20px',
        }}
      >
        <h4 style={{ fontSize: 15, marginBottom: 4, fontFamily: 'Playfair Display, serif' }}>{current.title}</h4>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{current.description}</p>
        <PipelinePreview pipelineId={current.id} data={data as MlBundle | undefined} />
        {!isError && <MlSampleTable pipelineId={current.id} samples={(data as MlBundle | undefined)?.predictionSamples} />}
      </div>

      <div className="ml-pipelines-controls ml-pipelines-controls-mobile" style={{ paddingTop: 4, borderTop: '1px solid var(--border)' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', minWidth: 200 }}>
          <select
            aria-label="Select ML pipeline"
            value={pipelineIndex}
            onChange={(e) => setPipelineIndex(Number(e.target.value))}
            style={{
              width: '100%',
              maxWidth: 420,
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 10px',
              background: 'var(--surface-1)',
              fontSize: 14,
              color: 'var(--text)',
            }}
          >
            {ML_PIPELINES.map((p, i) => (
              <option key={p.id} value={i}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ml-pipelines-controls ml-pipelines-controls-desktop" style={{ paddingTop: 4, borderTop: '1px solid var(--border)' }}>
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
    </div>
  )
}
