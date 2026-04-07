import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Heart, CheckCircle, PhilippinePeso } from 'lucide-react'
import { createDonation } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000]
const CAMPAIGNS = ['General Fund', 'Emergency Shelter', 'Education Support', 'Counseling Services', 'Reintegration Program']
const DONATION_TYPES = ['Monetary', 'InKind', 'Time', 'Skills', 'SocialMedia'] as const
const CHANNEL_SOURCES = ['Campaign', 'Event', 'Direct', 'SocialMedia', 'PartnerReferral'] as const
const IMPACT_UNITS = ['pesos', 'items', 'hours', 'campaigns'] as const
const t = {
  en: {
    invalidAmount: 'Please enter a valid monetary amount',
    invalidEstimate: 'Please enter a valid estimated value',
    genericError: 'Something went wrong. Please try again.',
    thankYou: 'Thank You!',
    recorded: 'has been recorded.',
    everyPeso: 'Every peso you give helps a survivor heal, grow, and reclaim her future.',
    dashboard: 'View My Dashboard',
    donateAgain: 'Donate Again',
    backHome: 'Back to Home',
    badge: 'Make a Difference',
    title: 'Donate to Open Arms',
    subtitle: 'Your support provides shelter, healing, and hope to survivors of abuse and trafficking across the Philippines.',
    chooseAmount: 'Choose an Amount',
    customAmount: 'Or enter a custom amount (₱)',
    details: 'Donation Details',
    donationType: 'Donation Type',
    donationDate: 'Donation Date',
    campaign: 'Campaign',
    channelSource: 'Channel Source',
    impactUnit: 'Impact Unit',
    estimatedValue: 'Estimated Value',
    estimatedPlaceholder: 'Estimated value for this donation',
    referralPostId: 'Referral Post ID (optional)',
    monthly: 'Make this a monthly donation',
    monthlySub: 'Help us plan ahead with recurring support',
    message: 'Message (optional)',
    messagePlaceholder: 'Leave a note of encouragement...',
    donatingAs: 'Donating as',
    historySaved: '— your donation history will be saved',
    accountRequired: 'Account required to donate',
    accountPrompt: 'Please create an account to donate.',
    createAccount: 'Create a free account',
    signIn: 'sign in',
    accountHelp: 'Please create a free account or sign in to make a donation. This helps us and you track your giving.',
    processing: 'Processing...',
    donateNow: 'Now',
    simulated: 'This is a simulated donation for demonstration purposes. No real payment is processed.',
  },
  tl: {
    invalidAmount: 'Pakilagay ang tamang halagang pera.',
    invalidEstimate: 'Pakilagay ang tamang tinatayang halaga.',
    genericError: 'May nangyaring mali. Pakisubukan muli.',
    thankYou: 'Maraming Salamat!',
    recorded: 'ay naitala na.',
    everyPeso: 'Bawat pisong ibinibigay mo ay tumutulong sa paggaling at pag-asa ng survivor.',
    dashboard: 'Tingnan ang Aking Dashboard',
    donateAgain: 'Mag-donate Muli',
    backHome: 'Bumalik sa Home',
    badge: 'Makagawa ng Pagbabago',
    title: 'Mag-donate sa Open Arms',
    subtitle: 'Ang iyong suporta ay nagbibigay ng tirahan, paggaling, at pag-asa sa mga survivor sa buong Pilipinas.',
    chooseAmount: 'Pumili ng Halaga',
    customAmount: 'O maglagay ng custom na halaga (₱)',
    details: 'Detalye ng Donasyon',
    donationType: 'Uri ng Donasyon',
    donationDate: 'Petsa ng Donasyon',
    campaign: 'Kampanya',
    channelSource: 'Pinagmulan',
    impactUnit: 'Yunit ng Epekto',
    estimatedValue: 'Tinatayang Halaga',
    estimatedPlaceholder: 'Tinatayang halaga para sa donasyong ito',
    referralPostId: 'Referral Post ID (optional)',
    monthly: 'Gawing buwanang donasyon',
    monthlySub: 'Tulungan kaming makapagplano sa tuloy-tuloy na suporta',
    message: 'Mensahe (optional)',
    messagePlaceholder: 'Mag-iwan ng mensahe...',
    donatingAs: 'Nagdo-donate bilang',
    historySaved: '— mase-save ang history ng iyong donasyon',
    accountRequired: 'Kailangan ng account para makapag-donate',
    accountPrompt: 'Mangyaring gumawa ng account para makapag-donate.',
    createAccount: 'gumawa ng libreng account',
    signIn: 'mag-sign in',
    accountHelp: 'Mangyaring gumawa ng libreng account o mag-sign in para makapag-donate. Nakakatulong ito sa amin at sa iyo na masubaybayan ang iyong mga donasyon.',
    processing: 'Pinoproseso...',
    donateNow: 'Ngayon',
    simulated: 'Simulation lamang ito para sa demo. Walang totoong bayad na pinoproseso.',
  }
}

export default function Donate({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [donationType, setDonationType] = useState<typeof DONATION_TYPES[number]>('Monetary')
  const [donationDate, setDonationDate] = useState(new Date().toISOString().slice(0, 10))
  const [campaign, setCampaign] = useState('General Fund')
  const [channelSource, setChannelSource] = useState<typeof CHANNEL_SOURCES[number]>('Campaign')
  const [impactUnit, setImpactUnit] = useState<typeof IMPACT_UNITS[number]>('pesos')
  const [estimatedValue, setEstimatedValue] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [referralPostId, setReferralPostId] = useState('')
  const donorName = user?.displayName || ''
  const donorEmail = ''
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const finalAmount = customAmount ? Number(customAmount) : Number(amount)

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (donationType === 'Monetary' && (!finalAmount || finalAmount < 1)) {
      setError(tx.invalidAmount)
      return
    }
    if (donationType !== 'Monetary' && (!estimatedValue || Number(estimatedValue) <= 0)) {
      setError(tx.invalidEstimate)
      return
    }
    setError('')
    setLoading(true)
    try {
      const isMonetary = donationType === 'Monetary'
      const payloadAmount = isMonetary ? finalAmount : undefined
      const payloadEstimatedValue = isMonetary ? finalAmount : Number(estimatedValue)
      const payloadCurrency = isMonetary ? 'PHP' : undefined

      await createDonation({
        supporterId: (user as any)?.supporterId ?? undefined,
        donationType,
        donationDate,
        isRecurring,
        campaignName: campaign || undefined,
        channelSource,
        currencyCode: payloadCurrency,
        amount: payloadAmount,
        estimatedValue: payloadEstimatedValue,
        impactUnit,
        referralPostId: referralPostId ? Number(referralPostId) : undefined,
        notes: [
          message,
          donorName && !user ? `Donor: ${donorName}` : '',
          donorEmail && !user ? `Email: ${donorEmail}` : ''
        ].filter(Boolean).join(' | ')
      })
      await queryClient.invalidateQueries({ queryKey: ['my-donations'] })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || tx.genericError)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={40} color="#16a34a" />
          </div>
          <h1 style={{ fontSize: 36, color: 'var(--navy)', marginBottom: 16 }}>{tx.thankYou}</h1>
          <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>
            {lang === 'tl' ? 'Ang donasyon mong ' : 'Your donation of '}
            <strong style={{ color: 'var(--terracotta)' }}>₱{finalAmount.toLocaleString()}</strong>
            {lang === 'tl' ? ' para sa ' : ' to '}
            <strong>{campaign}</strong> {tx.recorded}
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>
            {tx.everyPeso}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user?.role === 'donor' && (
              <button className="btn btn-primary" onClick={() => navigate('/donor')}>{tx.dashboard}</button>
            )}
            <button className="btn btn-outline" onClick={() => { setSuccess(false); setAmount(''); setCustomAmount(''); setMessage('') }}>{tx.donateAgain}</button>
            <Link to="/" className="btn btn-ghost">{tx.backHome}</Link>
          </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--beige) 0%, white 100%)', padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(193,105,79,0.1)', color: 'var(--terracotta)', padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
              <Heart size={14} fill="currentColor" /> {tx.badge}
            </span>
            <h1 style={{ fontSize: 40, color: 'var(--navy)', marginBottom: 12 }}>{tx.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 17, lineHeight: 1.7 }}>
              {tx.subtitle}
            </p>
          </div>

          <form onSubmit={handleDonate}>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--navy)' }}>{tx.chooseAmount}</h3>
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
                <label style={{ fontSize: 13 }}>{tx.customAmount}</label>
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
              <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--navy)' }}>{tx.details}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label>{tx.donationType}</label>
                  <select value={donationType} onChange={e => setDonationType(e.target.value as typeof DONATION_TYPES[number])}>
                    {DONATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{tx.donationDate}</label>
                  <input type="date" value={donationDate} onChange={e => setDonationDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>{tx.campaign}</label>
                <select value={campaign} onChange={e => setCampaign(e.target.value)}>
                  {CAMPAIGNS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label>{tx.channelSource}</label>
                  <select value={channelSource} onChange={e => setChannelSource(e.target.value as typeof CHANNEL_SOURCES[number])}>
                    {CHANNEL_SOURCES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{tx.impactUnit}</label>
                  <select value={impactUnit} onChange={e => setImpactUnit(e.target.value as typeof IMPACT_UNITS[number])}>
                    {IMPACT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              {donationType !== 'Monetary' && (
                <div className="form-group">
                  <label>{tx.estimatedValue}</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={estimatedValue}
                    onChange={e => setEstimatedValue(e.target.value)}
                    placeholder={tx.estimatedPlaceholder}
                  />
                </div>
              )}
              <div className="form-group">
                <label>{tx.referralPostId}</label>
                <input
                  type="number"
                  min="1"
                  value={referralPostId}
                  onChange={e => setReferralPostId(e.target.value)}
                  placeholder="e.g. 123"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: isRecurring ? 'rgba(193,105,79,0.06)' : '#f9fafb', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', marginBottom: 16 }}
                onClick={() => setIsRecurring(r => !r)}>
                <div style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid', borderColor: isRecurring ? 'var(--terracotta)' : '#d1d5db', background: isRecurring ? 'var(--terracotta)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isRecurring && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.monthly}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tx.monthlySub}</div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>{tx.message}</label>
                <textarea rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder={tx.messagePlaceholder} style={{ resize: 'vertical' }} />
              </div>
            </div>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 20, fontSize: 14 }}>
                <CheckCircle size={16} color="#16a34a" />
                <span>{tx.donatingAs} <strong>{user.displayName}</strong></span>
                {user.role === 'donor' && <span style={{ color: 'var(--text-muted)' }}>{tx.historySaved}</span>}
              </div>
            )}

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{error}</div>
            )}

            {!user && (
              <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}></span>
                <div>
                  <div style={{ fontWeight: 600, color: '#9a3412', marginBottom: 4, fontSize: 15 }}>{tx.accountPrompt}</div>
                  <div style={{ fontSize: 14, color: '#c2410c', lineHeight: 1.6 }}>
                    <Link to="/signup" style={{ color: 'var(--terracotta)', fontWeight: 700, textDecoration: 'underline' }}>{tx.createAccount}</Link>
                    {lang === 'tl' ? ' o ' : ' or '}
                    <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 700, textDecoration: 'underline' }}>{tx.signIn}</Link>
                    {lang === 'tl' ? ' ' : ' '} {lang === 'tl'
                      ? 'para makapag-donate.'
                      : 'to make a donation.'}
                    {' '}
                    {lang === 'tl'
                      ? 'Nakakatulong ito sa amin at sa iyo na masubaybayan ang iyong mga donasyon.'
                      : 'This helps us and you track your giving.'}
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: 18, borderRadius: 14, opacity: !user ? 0.5 : 1 }}
              disabled={loading || !finalAmount || !user}>
              {loading ? tx.processing : `${lang === 'tl' ? 'Mag-donate ' : 'Donate '}${finalAmount ? `₱${finalAmount.toLocaleString()}` : ''} ${tx.donateNow}`}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
              {tx.simulated}
            </p>
          </form>
        </div>
      </div>
  )
}
