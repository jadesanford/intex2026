import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSocialMedia, getSocialMetrics } from '../../lib/api'
import { Share2, TrendingUp, Heart, Eye } from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: 'badge badge-purple', Facebook: 'badge badge-blue',
  Twitter: 'badge badge-blue', TikTok: 'badge badge-gray',
  YouTube: 'badge badge-red', LinkedIn: 'badge badge-blue'
}

function formatK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0) }
function formatPHP(n: number) {
  if (!n) return '₱0'
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

type PostRow = {
  postId: number; platform: string; postType: string; caption: string; createdAt: string;
  reach: number; likes: number; comments: number; shares: number; saves: number;
  impressions: number; engagementRate: number; clickThroughs: number;
  donationReferrals: number; estimatedDonationValuePhp: number;
  campaignName: string; isBoosted: boolean; boostBudgetPhp: number; postUrl: string
}

export default function SocialMedia() {
  const [platform, setPlatform] = useState('')

  const { data: posts, isLoading } = useQuery({
    queryKey: ['social', platform],
    queryFn: () => getSocialMedia(platform ? { platform } : undefined)
  })
  const { data: metrics } = useQuery({ queryKey: ['social-metrics'], queryFn: getSocialMetrics })

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 28 }}>Social Media Tracker</h1>
        {metrics?.totalPosts > 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {metrics.totalPosts} posts · {metrics.boostedPosts} boosted
          </div>
        )}
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Reach', value: formatK(metrics?.totalReach ?? 0), icon: <Eye size={20} />, color: 'var(--terracotta)' },
          { label: 'Total Impressions', value: formatK(metrics?.totalImpressions ?? 0), icon: <Share2 size={20} />, color: 'var(--navy)' },
          { label: 'Donation Referrals', value: metrics?.totalDonationReferrals ?? 0, icon: <TrendingUp size={20} />, color: 'var(--sage)' },
          { label: 'Est. Donation Value', value: formatPHP(metrics?.totalEstimatedDonations ?? 0), icon: <Heart size={20} />, color: '#e879f9' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      {metrics?.byPlatform && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>By Platform</h3>
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Platform</th><th>Posts</th><th>Reach</th><th>Impressions</th><th>Donation Referrals</th><th>Est. Value</th><th>Avg Engagement</th></tr></thead>
              <tbody>
                {metrics.byPlatform.map((p: { platform: string; postCount: number; totalReach: number; totalImpressions: number; totalDonationReferrals: number; totalEstimatedDonations: number; avgEngagementRate: number }) => (
                  <tr key={p.platform}>
                    <td><span className={PLATFORM_COLORS[p.platform] || 'badge badge-gray'}>{p.platform}</span></td>
                    <td>{p.postCount}</td>
                    <td>{formatK(p.totalReach)}</td>
                    <td>{formatK(p.totalImpressions)}</td>
                    <td>{p.totalDonationReferrals}</td>
                    <td style={{ fontWeight: 600, color: 'var(--sage)' }}>{formatPHP(p.totalEstimatedDonations)}</td>
                    <td>{(p.avgEngagementRate * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn', 'WhatsApp'].map(p => (
            <button key={p} onClick={() => setPlatform(p)} style={{
              padding: '6px 14px', borderRadius: 6, border: '1.5px solid', fontSize: 13, cursor: 'pointer',
              borderColor: platform === p ? 'var(--terracotta)' : 'var(--border)',
              background: platform === p ? 'var(--beige)' : 'white',
              color: platform === p ? 'var(--terracotta)' : 'var(--text-muted)', fontWeight: platform === p ? 600 : 400
            }}>{p || 'All'}</button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="loading-center"><div className="spinner" /></div>
        : (posts ?? []).length === 0 ? <div className="empty-state"><Share2 size={40} /><h3>No posts tracked</h3></div>
        : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Platform</th><th>Type</th><th>Caption</th>
                    <th>Reach</th><th>Likes</th><th>Engagement</th><th>Referrals</th><th>Est. Donations</th><th>Boosted</th>
                  </tr>
                </thead>
                <tbody>
                  {(posts ?? []).map((p: PostRow) => (
                    <tr key={p.postId}>
                      <td style={{ fontSize: 13 }}>{p.createdAt?.slice(0, 10)}</td>
                      <td><span className={PLATFORM_COLORS[p.platform] || 'badge badge-gray'}>{p.platform}</span></td>
                      <td style={{ fontSize: 12 }}>{p.postType}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                        {p.postUrl ? <a href={p.postUrl} target="_blank" rel="noopener" style={{ color: 'var(--terracotta)' }}>{p.caption || '(view post)'}</a> : p.caption}
                      </td>
                      <td style={{ fontSize: 13 }}>{formatK(p.reach)}</td>
                      <td style={{ fontSize: 13 }}>{formatK(p.likes)}</td>
                      <td style={{ fontSize: 13 }}>{p.engagementRate ? `${(p.engagementRate * 100).toFixed(1)}%` : '—'}</td>
                      <td style={{ fontSize: 13 }}>{p.donationReferrals || '—'}</td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--sage)' }}>{p.estimatedDonationValuePhp ? formatPHP(p.estimatedDonationValuePhp) : '—'}</td>
                      <td style={{ fontSize: 13 }}>{p.isBoosted ? <span style={{ color: 'var(--success)' }}>✓ {p.boostBudgetPhp ? formatPHP(p.boostBudgetPhp) : ''}</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  )
}
