import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { getSocialPost, updateSocialPost, deleteSocialPost } from '../../lib/api'

type PostRow = {
  postId: number
  platform?: string
  platformPostId?: string
  dayOfWeek?: string
  postHour?: number
  postType?: string
  mediaType?: string
  caption?: string
  hashtags?: string
  numHashtags?: number
  mentionsCount?: number
  hasCallToAction?: boolean
  callToActionType?: string
  contentTopic?: string
  sentimentTone?: string
  captionLength?: number
  featuresResidentStory?: boolean
  createdAt?: string
  reach?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  impressions?: number
  engagementRate?: number
  clickThroughs?: number
  videoViews?: number
  profileVisits?: number
  donationReferrals?: number
  estimatedDonationValuePhp?: number
  campaignName?: string
  isBoosted?: boolean
  boostBudgetPhp?: number
  postUrl?: string
  followerCountAtPost?: number
  watchTimeSeconds?: number
  avgViewDurationSeconds?: number
  subscriberCountAtPost?: number
  forwards?: number
}

function formatK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0) }
function formatPHP(n: number) {
  if (!n) return '₱0'
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}
function apiErrorMessage(err: unknown, fallback: string): string {
  const d = (err as { response?: { data?: { message?: string; detail?: string; title?: string } } })?.response?.data
  if (!d) return fallback
  return d.message || d.detail || d.title || fallback
}

export default function SocialMediaPostDetail() {
  const { id } = useParams<{ id: string }>()
  const postId = +id!
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [form, setForm] = useState({
    platform: 'Facebook', platformPostId: '', dayOfWeek: '', postHour: '', postType: 'Image', mediaType: '', createdAt: '', caption: '', postUrl: '',
    hashtags: '', numHashtags: '', mentionsCount: '', hasCallToAction: 'false', callToActionType: '', contentTopic: '', sentimentTone: '', captionLength: '', featuresResidentStory: 'false',
    reach: '', likes: '', comments: '', shares: '', saves: '',
    impressions: '', engagementRate: '', clickThroughs: '', videoViews: '', profileVisits: '',
    donationReferrals: '', estimatedDonationValuePhp: '', campaignName: '',
    isBoosted: 'false', boostBudgetPhp: '', followerCountAtPost: '', watchTimeSeconds: '', avgViewDurationSeconds: '', subscriberCountAtPost: '', forwards: ''
  })

  const { data, isLoading } = useQuery({
    queryKey: ['social-post', postId],
    queryFn: () => getSocialPost(postId)
  })

  const update = useMutation({
    mutationFn: () => updateSocialPost(postId, {
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
      qc.invalidateQueries({ queryKey: ['social-post', postId] })
      qc.invalidateQueries({ queryKey: ['social-metrics'] })
      setShowEdit(false)
    },
    onError: (err: unknown) => window.alert(apiErrorMessage(err, 'Unable to update social media post.'))
  })

  const remove = useMutation({
    mutationFn: () => deleteSocialPost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social'] })
      qc.invalidateQueries({ queryKey: ['social-metrics'] })
      navigate('/admin/social-media')
    },
    onError: (err: unknown) => setDeleteError(apiErrorMessage(err, 'Unable to delete social media post.'))
  })

  function openEditFromPost(p: PostRow) {
    setForm({
      platform: p.platform || 'Facebook',
      platformPostId: p.platformPostId || '',
      dayOfWeek: p.dayOfWeek || '',
      postHour: p.postHour != null ? String(p.postHour) : '',
      postType: p.postType || 'Image',
      mediaType: p.mediaType || '',
      createdAt: p.createdAt?.slice(0, 10) || '',
      caption: p.caption || '',
      postUrl: p.postUrl || '',
      hashtags: p.hashtags || '',
      numHashtags: p.numHashtags != null ? String(p.numHashtags) : '',
      mentionsCount: p.mentionsCount != null ? String(p.mentionsCount) : '',
      hasCallToAction: p.hasCallToAction ? 'true' : 'false',
      callToActionType: p.callToActionType || '',
      contentTopic: p.contentTopic || '',
      sentimentTone: p.sentimentTone || '',
      captionLength: p.captionLength != null ? String(p.captionLength) : '',
      featuresResidentStory: p.featuresResidentStory ? 'true' : 'false',
      reach: p.reach != null ? String(p.reach) : '',
      likes: p.likes != null ? String(p.likes) : '',
      comments: p.comments != null ? String(p.comments) : '',
      shares: p.shares != null ? String(p.shares) : '',
      saves: p.saves != null ? String(p.saves) : '',
      impressions: p.impressions != null ? String(p.impressions) : '',
      engagementRate: p.engagementRate != null ? String(p.engagementRate) : '',
      clickThroughs: p.clickThroughs != null ? String(p.clickThroughs) : '',
      videoViews: p.videoViews != null ? String(p.videoViews) : '',
      profileVisits: p.profileVisits != null ? String(p.profileVisits) : '',
      donationReferrals: p.donationReferrals != null ? String(p.donationReferrals) : '',
      estimatedDonationValuePhp: p.estimatedDonationValuePhp != null ? String(p.estimatedDonationValuePhp) : '',
      campaignName: p.campaignName || '',
      isBoosted: p.isBoosted ? 'true' : 'false',
      boostBudgetPhp: p.boostBudgetPhp != null ? String(p.boostBudgetPhp) : '',
      followerCountAtPost: p.followerCountAtPost != null ? String(p.followerCountAtPost) : '',
      watchTimeSeconds: p.watchTimeSeconds != null ? String(p.watchTimeSeconds) : '',
      avgViewDurationSeconds: p.avgViewDurationSeconds != null ? String(p.avgViewDurationSeconds) : '',
      subscriberCountAtPost: p.subscriberCountAtPost != null ? String(p.subscriberCountAtPost) : '',
      forwards: p.forwards != null ? String(p.forwards) : ''
    })
    setShowEdit(true)
  }

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>
  if (!data) return <div className="card" style={{ padding: 24 }}>Post not found.</div>
  const p = data as PostRow

  return (
    <div>
      <Link to="/admin/social-media" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to Social Media
      </Link>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 28 }}>{p.platform || 'Platform'} Post #{p.postId}</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.createdAt?.slice(0, 10) || '—'} · {p.postType || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => openEditFromPost(p)}>Edit</button>
          <button className="btn btn-danger" onClick={() => { setDeleteError(''); setConfirmDelete(true) }}>Delete</button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          ['Reach', formatK(p.reach || 0)],
          ['Impressions', formatK(p.impressions || 0)],
          ['Engagement', p.engagementRate ? `${(p.engagementRate * 100).toFixed(2)}%` : '—'],
          ['Est. Donations', formatPHP(p.estimatedDonationValuePhp || 0)]
        ].map(([label, value]) => (
          <div key={label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Post Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <div><strong>Platform Post ID:</strong> {p.platformPostId || '—'}</div>
            <div><strong>Day/Hour:</strong> {p.dayOfWeek || '—'} {p.postHour != null ? `· ${p.postHour}:00` : ''}</div>
            <div><strong>Media Type:</strong> {p.mediaType || '—'}</div>
            <div><strong>Campaign:</strong> {p.campaignName || '—'}</div>
            <div><strong>Topic/Tone:</strong> {p.contentTopic || '—'} · {p.sentimentTone || '—'}</div>
            <div><strong>Hashtags:</strong> {p.hashtags || '—'} ({p.numHashtags ?? 0})</div>
            <div><strong>Mentions:</strong> {p.mentionsCount ?? 0}</div>
            <div><strong>CTA:</strong> {p.hasCallToAction ? `Yes${p.callToActionType ? ` (${p.callToActionType})` : ''}` : 'No'}</div>
            <div><strong>Caption Length:</strong> {p.captionLength ?? 0} chars</div>
            <div><strong>Features Resident Story:</strong> {p.featuresResidentStory ? 'Yes' : 'No'}</div>
            <div><strong>URL:</strong> {p.postUrl ? <a href={p.postUrl} target="_blank" rel="noopener" style={{ color: 'var(--terracotta)' }}>{p.postUrl}</a> : '—'}</div>
            <div><strong>Boosted:</strong> {p.isBoosted ? `Yes${p.boostBudgetPhp ? ` (${formatPHP(p.boostBudgetPhp)})` : ''}` : 'No'}</div>
            <div><strong>Clicks:</strong> {formatK(p.clickThroughs || 0)} · <strong>Referrals:</strong> {formatK(p.donationReferrals || 0)}</div>
            <div><strong>Likes:</strong> {formatK(p.likes || 0)} · <strong>Comments:</strong> {formatK(p.comments || 0)} · <strong>Shares:</strong> {formatK(p.shares || 0)}</div>
            <div><strong>Video Views:</strong> {formatK(p.videoViews || 0)} · <strong>Profile Visits:</strong> {formatK(p.profileVisits || 0)}</div>
            <div><strong>Followers at Post:</strong> {formatK(p.followerCountAtPost || 0)} · <strong>Subscribers at Post:</strong> {formatK(p.subscriberCountAtPost || 0)}</div>
            <div><strong>Watch Time:</strong> {formatK(p.watchTimeSeconds || 0)}s · <strong>Avg View:</strong> {formatK(p.avgViewDurationSeconds || 0)}s</div>
            <div><strong>Forwards:</strong> {formatK(p.forwards || 0)}</div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Caption</h3>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text)' }}>{p.caption || 'No caption.'}</p>
        </div>
      </div>

      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Edit Social Post</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowEdit(false)}>✕</button></div>
            <div className="grid-2">
              <div className="form-group"><label>Platform *</label><input value={form.platform} onChange={e => setForm(x => ({ ...x, platform: e.target.value }))} /></div>
              <div className="form-group"><label>Platform Post ID</label><input value={form.platformPostId} onChange={e => setForm(x => ({ ...x, platformPostId: e.target.value }))} /></div>
              <div className="form-group"><label>Day of Week</label><input value={form.dayOfWeek} onChange={e => setForm(x => ({ ...x, dayOfWeek: e.target.value }))} /></div>
              <div className="form-group"><label>Post Hour</label><input type="number" value={form.postHour} onChange={e => setForm(x => ({ ...x, postHour: e.target.value }))} /></div>
              <div className="form-group"><label>Post Type</label><input value={form.postType} onChange={e => setForm(x => ({ ...x, postType: e.target.value }))} /></div>
              <div className="form-group"><label>Media Type</label><input value={form.mediaType} onChange={e => setForm(x => ({ ...x, mediaType: e.target.value }))} /></div>
              <div className="form-group"><label>Date</label><input type="date" value={form.createdAt} onChange={e => setForm(x => ({ ...x, createdAt: e.target.value }))} /></div>
              <div className="form-group"><label>Post URL</label><input value={form.postUrl} onChange={e => setForm(x => ({ ...x, postUrl: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Caption</label><textarea rows={2} value={form.caption} onChange={e => setForm(x => ({ ...x, caption: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Hashtags</label><input value={form.hashtags} onChange={e => setForm(x => ({ ...x, hashtags: e.target.value }))} /></div>
              <div className="form-group"><label>Num Hashtags</label><input type="number" value={form.numHashtags} onChange={e => setForm(x => ({ ...x, numHashtags: e.target.value }))} /></div>
              <div className="form-group"><label>Mentions Count</label><input type="number" value={form.mentionsCount} onChange={e => setForm(x => ({ ...x, mentionsCount: e.target.value }))} /></div>
              <div className="form-group"><label>Has CTA</label><select value={form.hasCallToAction} onChange={e => setForm(x => ({ ...x, hasCallToAction: e.target.value }))}><option value="false">No</option><option value="true">Yes</option></select></div>
              <div className="form-group"><label>CTA Type</label><input value={form.callToActionType} onChange={e => setForm(x => ({ ...x, callToActionType: e.target.value }))} /></div>
              <div className="form-group"><label>Content Topic</label><input value={form.contentTopic} onChange={e => setForm(x => ({ ...x, contentTopic: e.target.value }))} /></div>
              <div className="form-group"><label>Sentiment Tone</label><input value={form.sentimentTone} onChange={e => setForm(x => ({ ...x, sentimentTone: e.target.value }))} /></div>
              <div className="form-group"><label>Caption Length</label><input type="number" value={form.captionLength} onChange={e => setForm(x => ({ ...x, captionLength: e.target.value }))} /></div>
              <div className="form-group"><label>Features Resident Story</label><select value={form.featuresResidentStory} onChange={e => setForm(x => ({ ...x, featuresResidentStory: e.target.value }))}><option value="false">No</option><option value="true">Yes</option></select></div>
              <div className="form-group"><label>Reach</label><input type="number" value={form.reach} onChange={e => setForm(x => ({ ...x, reach: e.target.value }))} /></div>
              <div className="form-group"><label>Impressions</label><input type="number" value={form.impressions} onChange={e => setForm(x => ({ ...x, impressions: e.target.value }))} /></div>
              <div className="form-group"><label>Likes</label><input type="number" value={form.likes} onChange={e => setForm(x => ({ ...x, likes: e.target.value }))} /></div>
              <div className="form-group"><label>Comments</label><input type="number" value={form.comments} onChange={e => setForm(x => ({ ...x, comments: e.target.value }))} /></div>
              <div className="form-group"><label>Shares</label><input type="number" value={form.shares} onChange={e => setForm(x => ({ ...x, shares: e.target.value }))} /></div>
              <div className="form-group"><label>Saves</label><input type="number" value={form.saves} onChange={e => setForm(x => ({ ...x, saves: e.target.value }))} /></div>
              <div className="form-group"><label>Click Throughs</label><input type="number" value={form.clickThroughs} onChange={e => setForm(x => ({ ...x, clickThroughs: e.target.value }))} /></div>
              <div className="form-group"><label>Video Views</label><input type="number" value={form.videoViews} onChange={e => setForm(x => ({ ...x, videoViews: e.target.value }))} /></div>
              <div className="form-group"><label>Engagement Rate</label><input type="number" step="0.0001" value={form.engagementRate} onChange={e => setForm(x => ({ ...x, engagementRate: e.target.value }))} /></div>
              <div className="form-group"><label>Profile Visits</label><input type="number" value={form.profileVisits} onChange={e => setForm(x => ({ ...x, profileVisits: e.target.value }))} /></div>
              <div className="form-group"><label>Est. Donation Value</label><input type="number" value={form.estimatedDonationValuePhp} onChange={e => setForm(x => ({ ...x, estimatedDonationValuePhp: e.target.value }))} /></div>
              <div className="form-group"><label>Donation Referrals</label><input type="number" value={form.donationReferrals} onChange={e => setForm(x => ({ ...x, donationReferrals: e.target.value }))} /></div>
              <div className="form-group"><label>Campaign Name</label><input value={form.campaignName} onChange={e => setForm(x => ({ ...x, campaignName: e.target.value }))} /></div>
              <div className="form-group"><label>Boosted</label><select value={form.isBoosted} onChange={e => setForm(x => ({ ...x, isBoosted: e.target.value }))}><option value="false">No</option><option value="true">Yes</option></select></div>
              <div className="form-group"><label>Boost Budget</label><input type="number" value={form.boostBudgetPhp} onChange={e => setForm(x => ({ ...x, boostBudgetPhp: e.target.value }))} /></div>
              <div className="form-group"><label>Follower Count at Post</label><input type="number" value={form.followerCountAtPost} onChange={e => setForm(x => ({ ...x, followerCountAtPost: e.target.value }))} /></div>
              <div className="form-group"><label>Watch Time Seconds</label><input type="number" value={form.watchTimeSeconds} onChange={e => setForm(x => ({ ...x, watchTimeSeconds: e.target.value }))} /></div>
              <div className="form-group"><label>Avg View Duration Seconds</label><input type="number" value={form.avgViewDurationSeconds} onChange={e => setForm(x => ({ ...x, avgViewDurationSeconds: e.target.value }))} /></div>
              <div className="form-group"><label>Subscriber Count at Post</label><input type="number" value={form.subscriberCountAtPost} onChange={e => setForm(x => ({ ...x, subscriberCountAtPost: e.target.value }))} /></div>
              <div className="form-group"><label>Forwards</label><input type="number" value={form.forwards} onChange={e => setForm(x => ({ ...x, forwards: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => update.mutate()} disabled={update.isPending || !form.platform}>
                {update.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => { setConfirmDelete(false); setDeleteError('') }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#fee2e2', color: '#b91c1c' }}>
                <AlertTriangle size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: 20 }}>Delete social post</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>This action cannot be undone.</p>
            {deleteError && <p style={{ margin: '12px 0 0', color: '#b91c1c', fontSize: 13 }}>{deleteError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setConfirmDelete(false); setDeleteError('') }}>Cancel</button>
              <button type="button" className="btn btn-danger" disabled={remove.isPending} onClick={() => remove.mutate()}>
                {remove.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
