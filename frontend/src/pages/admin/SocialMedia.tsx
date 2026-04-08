import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSocialMedia, getSocialMetrics, createSocialPost } from '../../lib/api'
import { Share2, TrendingUp, Heart, Eye, Plus } from 'lucide-react'

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
  postId: number; platform: string; platformPostId?: string; postType: string; mediaType?: string; caption: string; createdAt: string;
  dayOfWeek?: string; postHour?: number; hashtags?: string; numHashtags?: number; mentionsCount?: number;
  hasCallToAction?: boolean; callToActionType?: string; contentTopic?: string; sentimentTone?: string; captionLength?: number; featuresResidentStory?: boolean;
  reach: number; likes: number; comments: number; shares: number; saves: number;
  impressions: number; engagementRate: number; clickThroughs: number; videoViews?: number; profileVisits?: number;
  donationReferrals: number; estimatedDonationValuePhp: number;
  campaignName: string; isBoosted: boolean; boostBudgetPhp: number; postUrl: string;
  followerCountAtPost?: number; watchTimeSeconds?: number; avgViewDurationSeconds?: number; subscriberCountAtPost?: number; forwards?: number
}

export default function SocialMedia() {
  const qc = useQueryClient()
  const [platform, setPlatform] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    platform: 'Facebook',
    platformPostId: '',
    dayOfWeek: '',
    postHour: '',
    postType: 'Image',
    mediaType: '',
    createdAt: new Date().toISOString().slice(0, 10),
    caption: '',
    postUrl: '',
    hashtags: '',
    numHashtags: '',
    mentionsCount: '',
    hasCallToAction: 'false',
    callToActionType: '',
    contentTopic: '',
    sentimentTone: '',
    captionLength: '',
    featuresResidentStory: 'false',
    reach: '',
    likes: '',
    comments: '',
    shares: '',
    saves: '',
    impressions: '',
    engagementRate: '',
    clickThroughs: '',
    videoViews: '',
    profileVisits: '',
    donationReferrals: '',
    estimatedDonationValuePhp: '',
    campaignName: '',
    isBoosted: 'false',
    boostBudgetPhp: '',
    followerCountAtPost: '',
    watchTimeSeconds: '',
    avgViewDurationSeconds: '',
    subscriberCountAtPost: '',
    forwards: ''
  })

  function apiErrorMessage(err: unknown, fallback: string): string {
    const d = (err as { response?: { data?: { message?: string; detail?: string; title?: string } } })?.response?.data
    if (!d) return fallback
    return d.message || d.detail || d.title || fallback
  }

  function resetForm() {
    setForm({
      platform: 'Facebook',
      platformPostId: '',
      dayOfWeek: '',
      postHour: '',
      postType: 'Image',
      mediaType: '',
      createdAt: new Date().toISOString().slice(0, 10),
      caption: '',
      postUrl: '',
      hashtags: '',
      numHashtags: '',
      mentionsCount: '',
      hasCallToAction: 'false',
      callToActionType: '',
      contentTopic: '',
      sentimentTone: '',
      captionLength: '',
      featuresResidentStory: 'false',
      reach: '',
      likes: '',
      comments: '',
      shares: '',
      saves: '',
      impressions: '',
      engagementRate: '',
      clickThroughs: '',
      videoViews: '',
      profileVisits: '',
      donationReferrals: '',
      estimatedDonationValuePhp: '',
      campaignName: '',
      isBoosted: 'false',
      boostBudgetPhp: '',
      followerCountAtPost: '',
      watchTimeSeconds: '',
      avgViewDurationSeconds: '',
      subscriberCountAtPost: '',
      forwards: ''
    })
  }

  const create = useMutation({
    mutationFn: () => createSocialPost({
      platform: form.platform,
      platformPostId: form.platformPostId || null,
      dayOfWeek: form.dayOfWeek || null,
      postHour: form.postHour ? +form.postHour : null,
      postType: form.postType,
      mediaType: form.mediaType || null,
      createdAt: form.createdAt || null,
      caption: form.caption,
      postUrl: form.postUrl || null,
      hashtags: form.hashtags || null,
      numHashtags: form.numHashtags ? +form.numHashtags : null,
      mentionsCount: form.mentionsCount ? +form.mentionsCount : null,
      hasCallToAction: form.hasCallToAction === 'true',
      callToActionType: form.callToActionType || null,
      contentTopic: form.contentTopic || null,
      sentimentTone: form.sentimentTone || null,
      captionLength: form.captionLength ? +form.captionLength : null,
      featuresResidentStory: form.featuresResidentStory === 'true',
      reach: form.reach ? +form.reach : null,
      likes: form.likes ? +form.likes : null,
      comments: form.comments ? +form.comments : null,
      shares: form.shares ? +form.shares : null,
      saves: form.saves ? +form.saves : null,
      impressions: form.impressions ? +form.impressions : null,
      engagementRate: form.engagementRate ? +form.engagementRate : null,
      clickThroughs: form.clickThroughs ? +form.clickThroughs : null,
      videoViews: form.videoViews ? +form.videoViews : null,
      profileVisits: form.profileVisits ? +form.profileVisits : null,
      donationReferrals: form.donationReferrals ? +form.donationReferrals : null,
      estimatedDonationValuePhp: form.estimatedDonationValuePhp ? +form.estimatedDonationValuePhp : null,
      campaignName: form.campaignName || null,
      isBoosted: form.isBoosted === 'true',
      boostBudgetPhp: form.boostBudgetPhp ? +form.boostBudgetPhp : null,
      followerCountAtPost: form.followerCountAtPost ? +form.followerCountAtPost : null,
      watchTimeSeconds: form.watchTimeSeconds ? +form.watchTimeSeconds : null,
      avgViewDurationSeconds: form.avgViewDurationSeconds ? +form.avgViewDurationSeconds : null,
      subscriberCountAtPost: form.subscriberCountAtPost ? +form.subscriberCountAtPost : null,
      forwards: form.forwards ? +form.forwards : null
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social'] })
      qc.invalidateQueries({ queryKey: ['social-metrics'] })
      setShowModal(false)
      resetForm()
    },
    onError: (err: unknown) => window.alert(apiErrorMessage(err, 'Unable to create social media post.'))
  })

  const { data: posts, isLoading } = useQuery({
    queryKey: ['social', platform],
    queryFn: () => getSocialMedia(platform ? { platform } : undefined)
  })
  const { data: metrics } = useQuery({ queryKey: ['social-metrics'], queryFn: getSocialMetrics })

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: 28 }}>Social Media Tracker</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {metrics?.totalPosts > 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {metrics.totalPosts} posts · {metrics.boostedPosts} boosted
            </div>
          )}
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
            <Plus size={16} /> Add Post
          </button>
        </div>
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
                    <th>Performance</th><th>Status</th><th>Action</th>
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
                      <td style={{ fontSize: 13 }}>
                        {formatK(p.reach || 0)} reach · {p.engagementRate ? `${(p.engagementRate * 100).toFixed(1)}%` : '—'} ER
                      </td>
                      <td style={{ fontSize: 13 }}>{p.isBoosted ? <span style={{ color: 'var(--success)' }}>Boosted</span> : 'Organic'}</td>
                      <td>
                        <Link to={`/admin/social-media/${p.postId}`} style={{ color: 'var(--terracotta)', fontSize: 13, fontWeight: 500 }}>
                          View details →
                        </Link>
                      </td>
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
            <div className="modal-header">
              <h2>Add Social Post</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Platform *</label>
                <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}>
                  {['Facebook', 'Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn', 'WhatsApp'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Platform Post ID</label><input value={form.platformPostId} onChange={e => setForm(p => ({ ...p, platformPostId: e.target.value }))} /></div>
              <div className="form-group"><label>Day of Week</label><input value={form.dayOfWeek} onChange={e => setForm(p => ({ ...p, dayOfWeek: e.target.value }))} placeholder="Monday" /></div>
              <div className="form-group"><label>Post Hour</label><input type="number" value={form.postHour} onChange={e => setForm(p => ({ ...p, postHour: e.target.value }))} /></div>
              <div className="form-group"><label>Post Type</label><input value={form.postType} onChange={e => setForm(p => ({ ...p, postType: e.target.value }))} /></div>
              <div className="form-group"><label>Media Type</label><input value={form.mediaType} onChange={e => setForm(p => ({ ...p, mediaType: e.target.value }))} /></div>
              <div className="form-group"><label>Date</label><input type="date" value={form.createdAt} onChange={e => setForm(p => ({ ...p, createdAt: e.target.value }))} /></div>
              <div className="form-group"><label>Post URL</label><input value={form.postUrl} onChange={e => setForm(p => ({ ...p, postUrl: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Caption</label><textarea rows={2} value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Hashtags</label><input value={form.hashtags} onChange={e => setForm(p => ({ ...p, hashtags: e.target.value }))} placeholder="#tag1, #tag2" /></div>
              <div className="form-group"><label>Number of Hashtags</label><input type="number" value={form.numHashtags} onChange={e => setForm(p => ({ ...p, numHashtags: e.target.value }))} /></div>
              <div className="form-group"><label>Mentions Count</label><input type="number" value={form.mentionsCount} onChange={e => setForm(p => ({ ...p, mentionsCount: e.target.value }))} /></div>
              <div className="form-group"><label>Has CTA</label><select value={form.hasCallToAction} onChange={e => setForm(p => ({ ...p, hasCallToAction: e.target.value }))}><option value="false">No</option><option value="true">Yes</option></select></div>
              <div className="form-group"><label>CTA Type</label><input value={form.callToActionType} onChange={e => setForm(p => ({ ...p, callToActionType: e.target.value }))} /></div>
              <div className="form-group"><label>Content Topic</label><input value={form.contentTopic} onChange={e => setForm(p => ({ ...p, contentTopic: e.target.value }))} /></div>
              <div className="form-group"><label>Sentiment Tone</label><input value={form.sentimentTone} onChange={e => setForm(p => ({ ...p, sentimentTone: e.target.value }))} /></div>
              <div className="form-group"><label>Caption Length</label><input type="number" value={form.captionLength} onChange={e => setForm(p => ({ ...p, captionLength: e.target.value }))} /></div>
              <div className="form-group"><label>Features Resident Story</label><select value={form.featuresResidentStory} onChange={e => setForm(p => ({ ...p, featuresResidentStory: e.target.value }))}><option value="false">No</option><option value="true">Yes</option></select></div>
              <div className="form-group"><label>Reach</label><input type="number" value={form.reach} onChange={e => setForm(p => ({ ...p, reach: e.target.value }))} /></div>
              <div className="form-group"><label>Impressions</label><input type="number" value={form.impressions} onChange={e => setForm(p => ({ ...p, impressions: e.target.value }))} /></div>
              <div className="form-group"><label>Likes</label><input type="number" value={form.likes} onChange={e => setForm(p => ({ ...p, likes: e.target.value }))} /></div>
              <div className="form-group"><label>Comments</label><input type="number" value={form.comments} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} /></div>
              <div className="form-group"><label>Shares</label><input type="number" value={form.shares} onChange={e => setForm(p => ({ ...p, shares: e.target.value }))} /></div>
              <div className="form-group"><label>Saves</label><input type="number" value={form.saves} onChange={e => setForm(p => ({ ...p, saves: e.target.value }))} /></div>
              <div className="form-group"><label>CTR / Click-throughs</label><input type="number" value={form.clickThroughs} onChange={e => setForm(p => ({ ...p, clickThroughs: e.target.value }))} /></div>
              <div className="form-group"><label>Video Views</label><input type="number" value={form.videoViews} onChange={e => setForm(p => ({ ...p, videoViews: e.target.value }))} /></div>
              <div className="form-group"><label>Engagement Rate (decimal)</label><input type="number" step="0.0001" value={form.engagementRate} onChange={e => setForm(p => ({ ...p, engagementRate: e.target.value }))} /></div>
              <div className="form-group"><label>Profile Visits</label><input type="number" value={form.profileVisits} onChange={e => setForm(p => ({ ...p, profileVisits: e.target.value }))} /></div>
              <div className="form-group"><label>Donation Referrals</label><input type="number" value={form.donationReferrals} onChange={e => setForm(p => ({ ...p, donationReferrals: e.target.value }))} /></div>
              <div className="form-group"><label>Estimated Donation Value (PHP)</label><input type="number" value={form.estimatedDonationValuePhp} onChange={e => setForm(p => ({ ...p, estimatedDonationValuePhp: e.target.value }))} /></div>
              <div className="form-group"><label>Campaign</label><input value={form.campaignName} onChange={e => setForm(p => ({ ...p, campaignName: e.target.value }))} /></div>
              <div className="form-group"><label>Boosted</label>
                <select value={form.isBoosted} onChange={e => setForm(p => ({ ...p, isBoosted: e.target.value }))}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              {form.isBoosted === 'true' && (
                <div className="form-group"><label>Boost Budget (PHP)</label><input type="number" value={form.boostBudgetPhp} onChange={e => setForm(p => ({ ...p, boostBudgetPhp: e.target.value }))} /></div>
              )}
              <div className="form-group"><label>Follower Count at Post</label><input type="number" value={form.followerCountAtPost} onChange={e => setForm(p => ({ ...p, followerCountAtPost: e.target.value }))} /></div>
              <div className="form-group"><label>Watch Time (seconds)</label><input type="number" value={form.watchTimeSeconds} onChange={e => setForm(p => ({ ...p, watchTimeSeconds: e.target.value }))} /></div>
              <div className="form-group"><label>Avg View Duration (seconds)</label><input type="number" value={form.avgViewDurationSeconds} onChange={e => setForm(p => ({ ...p, avgViewDurationSeconds: e.target.value }))} /></div>
              <div className="form-group"><label>Subscriber Count at Post</label><input type="number" value={form.subscriberCountAtPost} onChange={e => setForm(p => ({ ...p, subscriberCountAtPost: e.target.value }))} /></div>
              <div className="form-group"><label>Forwards</label><input type="number" value={form.forwards} onChange={e => setForm(p => ({ ...p, forwards: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => create.mutate()} disabled={!form.platform || create.isPending}>
                {create.isPending ? 'Saving...' : 'Add Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
