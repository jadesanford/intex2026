import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSocialMedia, getSocialMetrics, createSocialPost } from '../../lib/api'
import { Plus, Share2, TrendingUp, Heart, Eye } from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'badge badge-purple',
  facebook: 'badge badge-blue',
  twitter: 'badge badge-blue',
  tiktok: 'badge badge-gray',
  youtube: 'badge badge-red',
  website: 'badge badge-green'
}

function formatK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0) }
function formatIDR(n: number) {
  if (!n) return 'Rp 0'
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}M`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function SocialMedia() {
  const qc = useQueryClient()
  const [platform, setPlatform] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ platform: 'instagram', postDate: new Date().toISOString().slice(0, 10), contentType: 'awareness', caption: '', reach: '', likes: '', shares: '', donationsLinked: '', donationAmountLinked: '', campaignTag: '' })

  const { data: posts, isLoading } = useQuery({ queryKey: ['social', platform], queryFn: () => getSocialMedia(platform ? { platform } : undefined) })
  const { data: metrics } = useQuery({ queryKey: ['social-metrics'], queryFn: getSocialMetrics })

  const create = useMutation({
    mutationFn: () => createSocialPost({ ...form, reach: form.reach ? +form.reach : null, likes: form.likes ? +form.likes : null, shares: form.shares ? +form.shares : null, donationsLinked: form.donationsLinked ? +form.donationsLinked : null, donationAmountLinked: form.donationAmountLinked ? +form.donationAmountLinked : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social'] }); qc.invalidateQueries({ queryKey: ['social-metrics'] }); setShowModal(false) }
  })

  const totalReach = (metrics?.totalReach ?? 0)
  const totalDonations = (metrics?.totalDonationsLinked ?? 0)

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 28 }}>Social Media Tracker</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Log Post</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Reach', value: formatK(totalReach), icon: <Eye size={20} />, color: 'var(--terracotta)' },
          { label: 'Total Likes', value: formatK(metrics?.totalLikes ?? 0), icon: <Heart size={20} />, color: '#e879f9' },
          { label: 'Posts Tracked', value: metrics?.totalPosts ?? 0, icon: <Share2 size={20} />, color: 'var(--navy)' },
          { label: 'Donations Linked', value: formatIDR(totalDonations), icon: <TrendingUp size={20} />, color: 'var(--sage)' },
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

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'instagram', 'facebook', 'tiktok', 'youtube', 'website'].map(p => (
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
        : (posts ?? []).length === 0 ? <div className="empty-state"><Share2 size={40} /><h3>No posts tracked yet</h3></div>
        : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Date</th><th>Platform</th><th>Type</th><th>Caption</th><th>Reach</th><th>Likes</th><th>Shares</th><th>Donations</th><th>Campaign</th></tr>
                </thead>
                <tbody>
                  {(posts ?? []).map((p: { id: number; postDate: string; platform: string; contentType: string; caption: string; reach: number; likes: number; shares: number; donationsLinked: number; donationAmountLinked: number; campaignTag: string }) => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 13 }}>{p.postDate?.slice(0, 10)}</td>
                      <td><span className={PLATFORM_COLORS[p.platform] || 'badge badge-gray'}>{p.platform}</span></td>
                      <td style={{ fontSize: 12, textTransform: 'capitalize' }}>{p.contentType?.replace('_', ' ')}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{p.caption}</td>
                      <td style={{ fontSize: 13 }}>{formatK(p.reach)}</td>
                      <td style={{ fontSize: 13 }}>{formatK(p.likes)}</td>
                      <td style={{ fontSize: 13 }}>{formatK(p.shares)}</td>
                      <td style={{ fontSize: 13 }}>{p.donationsLinked ? `${p.donationsLinked} · ${formatIDR(p.donationAmountLinked)}` : '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--terracotta)' }}>{p.campaignTag || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Log Social Post</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="grid-2">
              <div className="form-group"><label>Platform</label>
                <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}>
                  {['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'website'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Post Date</label><input type="date" value={form.postDate} onChange={e => setForm(p => ({ ...p, postDate: e.target.value }))} /></div>
              <div className="form-group"><label>Content Type</label>
                <select value={form.contentType} onChange={e => setForm(p => ({ ...p, contentType: e.target.value }))}>
                  {['awareness', 'fundraising', 'impact_story', 'event', 'educational', 'appeal'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Campaign Tag</label><input value={form.campaignTag} onChange={e => setForm(p => ({ ...p, campaignTag: e.target.value }))} placeholder="#OpenArms2024" /></div>
              <div className="form-group"><label>Reach</label><input type="number" value={form.reach} onChange={e => setForm(p => ({ ...p, reach: e.target.value }))} /></div>
              <div className="form-group"><label>Likes</label><input type="number" value={form.likes} onChange={e => setForm(p => ({ ...p, likes: e.target.value }))} /></div>
              <div className="form-group"><label>Shares</label><input type="number" value={form.shares} onChange={e => setForm(p => ({ ...p, shares: e.target.value }))} /></div>
              <div className="form-group"><label>Donations Linked (#)</label><input type="number" value={form.donationsLinked} onChange={e => setForm(p => ({ ...p, donationsLinked: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Donation Amount (IDR)</label><input type="number" value={form.donationAmountLinked} onChange={e => setForm(p => ({ ...p, donationAmountLinked: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label>Caption</label><textarea rows={3} value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? 'Saving...' : 'Log Post'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
