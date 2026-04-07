import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, CheckCircle, PhilippinePeso } from 'lucide-react'
import { createDonation } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import PublicLayout from '../components/PublicLayout'

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000]
const CAMPAIGNS = ['General Fund', 'Emergency Shelter', 'Education Support', 'Counseling Services', 'Reintegration Program']

type Props = { lang: 'en' | 'tl' }

export default function Donate({ lang }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [campaign, setCampaign] = useState('General Fund')
  const [isRecurring, setIsRecurring] = useState(false)
  const [donorName, setDonorName] = useState(user?.displayName || '')
  const [donorEmail, setDonorEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const finalAmount = customAmount ? Number(customAmount) : Number(amount)

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!finalAmount || finalAmount < 1) { setError('Please enter a valid amount'); return }
    setError('')
    setLoading(true)
    try {
      await createDonation({
        supporterId: (user as any)?.supporterId ?? null,
        amount: finalAmount,
        donationType: 'Monetary',
        channelSource: 'Website',
        campaignName: campaign,
        donationDate: new Date().toISOString().slice(0, 10),
        isRecurring,
        currencyCode: 'PHP',
        notes: [
          message,
          donorName && !user ? `Donor: ${donorName}` : '',
          donorEmail && !user ? `Email: ${donorEmail}` : ''
        ].filter(Boolean).join(' | ')
      })
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <PublicLayout lang={lang} setLang={() => {}}>
        <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={40} color="#16a34a" />
          </div>
          <h1 style={{ fontSize: 36, color: 'var(--navy)', marginBottom: 16 }}>Thank You!</h1>
          <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
            Your donation of <strong style={{ color: 'var(--terracotta)' }}>₱{finalAmount.toLocaleString()}</strong> to <strong>{campaign}</strong> has been recorded.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>
            Every peso you give helps a survivor heal, grow, and reclaim her future.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user?.role === 'donor' && (
              <button className="btn btn-primary" onClick={() => navigate('/donor')}>View My Dashboard</button>
            )}
            <button className="btn btn-outline" onClick={() => { setSuccess(false); setAmount(''); setCustomAmount(''); setMessage('') }}>Donate Again</button>
            <Link to="/" className="btn btn-ghost">Back to Home</Link>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout lang={lang} setLang={() => {}}>
      <div style={{ background: 'linear-gradient(135deg, var(--beige) 0%, white 100%)', padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(193,105,79,0.1)', color: 'var(--terracotta)', padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
              <Heart size={14} fill="currentColor" /> Make a Difference
            </span>
            <h1 style={{ fontSize: 40, color: 'var(--navy)', marginBottom: 12 }}>Donate to Open Arms</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 17, lineHeight: 1.7 }}>
              Your support provides shelter, healing, and hope to survivors of abuse and trafficking across the Philippines.
            </p>
          </div>

          <form onSubmit={handleDonate}>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--navy)' }}>Choose an Amount</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
                {PRESET_AMOUNTS.map(a => (
                  <button key={a} type="button"
                    onClick={() => { setAmount(String(a)); setCustomAmount('') }}
                    style={{
                      padding: '12px 8px', borderRadius: 10, border: '2px solid',
                      borderColor: amount === String(a) && !customAmount ? 'var(--terracotta)' : 'var(--border)',
                      background: amount === String(a) && !customAmount ? 'var(--terracotta)' : 'white',
                      color: amount === String(a) && !customAmount ? 'white' : 'var(--navy)',
                      fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s'
                    }}>
                    ₱{a >= 1000 ? `${a / 1000}K` : a}
                  </button>
                ))}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13 }}>Or enter a custom amount (₱)</label>
                <div style={{ position: 'relative' }}>
                  <PhilippinePeso size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="number" min="1" value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setAmount('') }}
                    placeholder="Enter amount"
                    style={{ paddingLeft: 36 }} />
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--navy)' }}>Donation Details</h3>
              <div className="form-group">
                <label>Campaign</label>
                <select value={campaign} onChange={e => setCampaign(e.target.value)}>
                  {CAMPAIGNS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: isRecurring ? 'rgba(193,105,79,0.06)' : '#f9fafb', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', marginBottom: 16 }}
                onClick={() => setIsRecurring(r => !r)}>
                <div style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid', borderColor: isRecurring ? 'var(--terracotta)' : '#d1d5db', background: isRecurring ? 'var(--terracotta)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isRecurring && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Make this a monthly donation</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Help us plan ahead with recurring support</div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Message (optional)</label>
                <textarea rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="Leave a note of encouragement..." style={{ resize: 'vertical' }} />
              </div>
            </div>

            {!user && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, marginBottom: 4, color: 'var(--navy)' }}>Your Information</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  <Link to="/signup" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Create an account</Link> to track your donations, or donate as a guest below.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Name (optional)</label>
                    <input value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Email (optional)</label>
                    <input type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                </div>
              </div>
            )}

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 20, fontSize: 14 }}>
                <CheckCircle size={16} color="#16a34a" />
                <span>Donating as <strong>{user.displayName}</strong></span>
                {user.role === 'donor' && <span style={{ color: 'var(--text-muted)' }}>— your donation history will be saved</span>}
              </div>
            )}

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{error}</div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: 18, borderRadius: 14 }}
              disabled={loading || !finalAmount}>
              {loading ? 'Processing...' : `Donate ${finalAmount ? `₱${finalAmount.toLocaleString()}` : ''} Now`}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
              🔒 This is a simulated donation for demonstration purposes. No real payment is processed.
            </p>
          </form>
        </div>
      </div>
    </PublicLayout>
  )
}
