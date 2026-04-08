// @ts-nocheck
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getImpactSnapshot, getPublicSafehouses, getDonationTrends, getOutcomeMetrics } from '../lib/api'
import { Users, Home, TrendingUp } from 'lucide-react'

const COLORS = ['#c1694f', '#6b8f71', '#1e2d4a', '#d4856e', '#4b6c8c', '#a05540']

function formatPHP(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

const t = {
  en: {
    title: 'Our Impact', subtitle: 'Transparency is core to our mission. See how your support translates into real change for survivors across the Philippines.',
    helped: 'Girls Helped', active: 'Currently in Care', locations: 'Safe Locations', reintegration: 'Reintegration Rate',
    donationTitle: 'Donation Trends', donationSub: 'Monthly support over time',
    outcomesTitle: 'Resident Outcomes', outcomesSub: 'Current status of all cases',
    safehouseTitle: 'Our Safe Locations', safehouseSub: 'Active shelters across the Philippines',
  },
  tl: {
    title: 'Aming Epekto', subtitle: 'Ang transparency ay nasa puso ng aming misyon. Alamin kung paano nakakatulong ang inyong suporta sa mga nakaligtas sa buong Pilipinas.',
    helped: 'Mga Batang Babae na Natulungan', active: 'Kasalukuyang sa Pag-aalaga', locations: 'Ligtas na Lokasyon', reintegration: 'Antas ng Muling Pagsasama',
    donationTitle: 'Mga Trend ng Donasyon', donationSub: 'Buwanang suporta sa paglipas ng panahon',
    outcomesTitle: 'Resulta ng mga Residente', outcomesSub: 'Kasalukuyang katayuan ng lahat ng kaso',
    safehouseTitle: 'Aming mga Ligtas na Lokasyon', safehouseSub: 'Mga aktibong shelter sa buong Pilipinas',
  }
}

export default function Impact({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  void formatPHP
  const { data: snap } = useQuery({ queryKey: ['impact-snapshot'], queryFn: getImpactSnapshot })
  const { data: safehouses } = useQuery({ queryKey: ['public-safehouses'], queryFn: getPublicSafehouses })
  const { data: trends } = useQuery({ queryKey: ['donation-trends'], queryFn: getDonationTrends })
  const { data: outcomes } = useQuery({ queryKey: ['outcome-metrics'], queryFn: getOutcomeMetrics })

  const stats = [
    { label: tx.helped, value: snap?.totalResidentsHelped ?? '—', icon: <Users size={22} />, color: '#c1694f' },
    { label: tx.active, value: snap?.activeResidents ?? '—', icon: <Home size={22} />, color: '#6b8f71' },
    { label: tx.locations, value: snap?.totalSafehouses ?? '—', icon: <Home size={22} />, color: '#1e2d4a' },
    { label: tx.reintegration, value: snap ? snap.reintegrationRate + '%' : '—', icon: <TrendingUp size={22} />, color: '#d4856e' },
  ]

  const pieData = outcomes?.byStatus?.map((s: { status: string; count: number }) => ({
    name: s.status, value: s.count
  })) ?? []

  const trendData = (trends ?? []).map((t: { month: string; total: number; count: number }) => ({
    month: t.month?.slice(5) || t.month, total: Math.round(t.total / 1_000)
  }))

  return (
    <div>
      <section
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.70)), url('/impact-hero.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: '80px 24px 60px',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <h1 style={{ fontSize: 48, marginBottom: 16}}>{tx.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 18, maxWidth: 640, margin: '0 auto' }}>{tx.subtitle}</p>
      </section>

      <section style={{ padding: '0 24px', marginTop: -24 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="grid-4">
            {stats.map(({ label, value, icon, color }) => (
              <div key={label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, margin: '0 auto 12px' }}>{icon}</div>
                <div style={{ fontSize: 36, fontWeight: 700, color, fontFamily: 'Playfair Display, serif' }}>{value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '48px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>{tx.donationTitle}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>{tx.donationSub}</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${v}K`} />
                <Tooltip formatter={(v: number) => [`₱${v}K`, 'Total']} />
                <Area type="monotone" dataKey="total" stroke="#c1694f" fill="rgba(193,105,79,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>{tx.outcomesTitle}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>{tx.outcomesSub}</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {safehouses && safehouses.length > 0 && (
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>{tx.safehouseTitle}</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 32 }}>{tx.safehouseSub}</p>
            <div className="grid-3">
              {safehouses.map((s: { safehouseId: number; name: string; city: string; region: string; province: string; capacityGirls: number; currentOccupancy: number }) => {
                const pct = s.capacityGirls > 0 ? Math.round((s.currentOccupancy / s.capacityGirls) * 100) : 0
                return (
                <div key={s.safehouseId} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)', flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Playfair Display, serif' }}>{s.name}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>{s.city}{s.province ? `, ${s.province}` : ''} · {s.region}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Capacity: {s.capacityGirls ?? 0}</span>
                    <span style={{ color: 'var(--terracotta)', fontWeight: 600 }}>{s.currentOccupancy ?? 0} in care</span>
                  </div>
                  <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      background: pct > 85 ? 'var(--danger)' : 'var(--terracotta)',
                      width: `${Math.min(100, pct)}%`
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{pct}% occupied</div>
                </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
