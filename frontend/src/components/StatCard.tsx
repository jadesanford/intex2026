interface Props {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  color?: string
  trend?: number
}

export default function StatCard({ label, value, sub, icon, color = 'var(--terracotta)', trend }: Props) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
        background: color, borderRadius: '12px 0 0 12px'
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
          {sub && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</div>}
          {trend !== undefined && (
            <div style={{ fontSize: 13, color: trend >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4, fontWeight: 500 }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color
          }}>{icon}</div>
        )}
      </div>
    </div>
  )
}
