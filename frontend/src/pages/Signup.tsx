import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, User, Mail, Lock, Phone, MapPin, Building2, Globe, ChevronRight, ChevronLeft } from 'lucide-react'
import { registerDonor } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const SUPPORTER_TYPES = [
  { value: 'MonetaryDonor', label: 'Monetary Donor', desc: 'I give financial donations' },
  { value: 'InKindDonor', label: 'In-Kind Donor', desc: 'I donate goods or materials' },
  { value: 'Volunteer', label: 'Volunteer', desc: 'I give my time and effort' },
  { value: 'SkillsContributor', label: 'Skills Contributor', desc: 'I offer professional skills' },
  { value: 'SocialMediaAdvocate', label: 'Social Media Advocate', desc: 'I spread awareness online' },
  { value: 'PartnerOrganization', label: 'Partner Organization', desc: 'My organization partners with Open Arms' },
]

const RELATIONSHIP_TYPES = [
  { value: 'Local', label: 'Local (Philippines)' },
  { value: 'International', label: 'International' },
  { value: 'PartnerOrganization', label: 'Partner Organization' },
]

const ACQUISITION_CHANNELS = [
  { value: 'Website', label: 'Website' },
  { value: 'SocialMedia', label: 'Social Media' },
  { value: 'Event', label: 'Event' },
  { value: 'WordOfMouth', label: 'Word of Mouth' },
  { value: 'PartnerReferral', label: 'Partner Referral' },
  { value: 'Church', label: 'Church' },
]

const PH_REGIONS = [
  'NCR – National Capital Region',
  'CAR – Cordillera Administrative Region',
  'Region I – Ilocos Region',
  'Region II – Cagayan Valley',
  'Region III – Central Luzon',
  'Region IV-A – CALABARZON',
  'MIMAROPA – Region IV-B',
  'Region V – Bicol Region',
  'Region VI – Western Visayas',
  'Region VII – Central Visayas',
  'Region VIII – Eastern Visayas',
  'Region IX – Zamboanga Peninsula',
  'Region X – Northern Mindanao',
  'Region XI – Davao Region',
  'Region XII – SOCCSKSARGEN',
  'Region XIII – Caraga',
  'BARMM – Bangsamoro',
]

const STEPS = ['About You', 'Contact & Location', 'Account Setup']

export default function Signup() {
  const navigate = useNavigate()
  const { loginWithData } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    supporterType: '',
    displayName: '',
    organizationName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    region: '',
    country: 'Philippines',
    relationshipType: 'Local',
    acquisitionChannel: '',
    firstDonationDate: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isOrg = form.supporterType === 'PartnerOrganization'

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const validateStep = () => {
    setError('')
    if (step === 0) {
      if (!form.supporterType) { setError('Please select your supporter type'); return false }
      if (isOrg && !form.organizationName) { setError('Organization name is required'); return false }
      if (!isOrg && (!form.firstName || !form.lastName)) { setError('First and last name are required'); return false }
    }
    if (step === 1) {
      if (!form.email) { setError('Email address is required'); return false }
      if (!form.acquisitionChannel) { setError('Please tell us how you found us'); return false }
    }
    if (step === 2) {
      if (!form.password) { setError('Password is required'); return false }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return false }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return false }
    }
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep()) return
    setLoading(true)
    try {
      const data = await registerDonor({
        username: form.email,
        password: form.password,
        supporterType: form.supporterType,
        displayName: form.displayName || undefined,
        organizationName: form.organizationName || undefined,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        email: form.email,
        phone: form.phone || undefined,
        region: form.region || undefined,
        country: form.country,
        relationshipType: form.relationshipType,
        acquisitionChannel: form.acquisitionChannel,
        firstDonationDate: form.firstDonationDate || undefined,
      })
      loginWithData(data)
      navigate('/donor')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)',
    fontSize: 15, outline: 'none', background: 'white', boxSizing: 'border-box'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--beige)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--navy)', marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={20} fill="white" color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, fontFamily: 'Playfair Display, serif' }}>Open Arms</span>
          </Link>
          <h1 style={{ fontSize: 28, marginBottom: 6, color: 'var(--navy)' }}>Create a Supporter Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Join us in supporting survivors across the Philippines</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i <= step ? 'var(--terracotta)' : 'white',
                  border: `2px solid ${i <= step ? 'var(--terracotta)' : 'var(--border)'}`,
                  color: i <= step ? 'white' : 'var(--text-muted)', fontWeight: 700, fontSize: 13, transition: 'all 0.2s'
                }}>{i + 1}</div>
                <span style={{ fontSize: 11, color: i === step ? 'var(--terracotta)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 60, height: 2, background: i < step ? 'var(--terracotta)' : 'var(--border)', margin: '0 8px', marginBottom: 20, transition: 'background 0.2s' }} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: '28px 32px' }}>

            {/* STEP 0: About You */}
            {step === 0 && (
              <div>
                <h2 style={{ fontSize: 18, marginBottom: 6, color: 'var(--navy)' }}>How do you support Open Arms?</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Select the option that best describes your role.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  {SUPPORTER_TYPES.map(t => (
                    <div key={t.value} onClick={() => setForm(p => ({ ...p, supporterType: t.value }))}
                      style={{
                        padding: '14px 16px', borderRadius: 12, border: '2px solid',
                        borderColor: form.supporterType === t.value ? 'var(--terracotta)' : 'var(--border)',
                        background: form.supporterType === t.value ? 'rgba(193,105,79,0.06)' : 'white',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: form.supporterType === t.value ? 'var(--terracotta)' : 'var(--navy)', marginBottom: 2 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
                    </div>
                  ))}
                </div>

                {form.supporterType && (
                  <div>
                    {isOrg ? (
                      <div>
                        <div className="form-group">
                          <label htmlFor="organizationName"><Building2 size={13} style={{ marginRight: 4 }} />Organization Name *</label>
                          <input id="organizationName" name="organizationName" value={form.organizationName} onChange={set('organizationName')} placeholder="Your organization's name" style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label htmlFor="displayName">Display Name (shown in communications)</label>
                          <input id="displayName" name="displayName" value={form.displayName} onChange={set('displayName')} placeholder="How should we address you?" style={inputStyle} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="firstName"><User size={13} style={{ marginRight: 4 }} />First Name *</label>
                            <input id="firstName" name="firstName" value={form.firstName} onChange={set('firstName')} placeholder="Maria" style={inputStyle} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="lastName">Last Name *</label>
                            <input id="lastName" name="lastName" value={form.lastName} onChange={set('lastName')} placeholder="Santos" style={inputStyle} />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label htmlFor="displayName">Display Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional override)</span></label>
                          <input id="displayName" name="displayName" value={form.displayName} onChange={set('displayName')} placeholder={`${form.firstName || 'Maria'} ${form.lastName || 'Santos'}`.trim() || 'How should we address you?'} style={inputStyle} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: Contact & Location */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 18, marginBottom: 6, color: 'var(--navy)' }}>Contact & Location</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>How can we reach you and where are you based?</p>

                <div className="form-group">
                  <label htmlFor="email"><Mail size={13} style={{ marginRight: 4 }} />Email Address *</label>
                  <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" style={inputStyle} />
                </div>

                <div className="form-group">
                  <label htmlFor="phone"><Phone size={13} style={{ marginRight: 4 }} />Phone Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+63 9XX XXX XXXX" style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="country"><Globe size={13} style={{ marginRight: 4 }} />Country</label>
                    <input id="country" name="country" autoComplete="country-name" value={form.country} onChange={set('country')} placeholder="Philippines" style={inputStyle} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="region"><MapPin size={13} style={{ marginRight: 4 }} />Region <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                    <select id="region" name="region" value={form.region} onChange={set('region')} style={{ ...inputStyle }}>
                      <option value="">Select region...</option>
                      {PH_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="Other">Other / International</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="relationshipType">Relationship Type</label>
                    <select id="relationshipType" name="relationshipType" value={form.relationshipType} onChange={set('relationshipType')} style={{ ...inputStyle }}>
                      {RELATIONSHIP_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="firstDonationDate">First Donation Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                    <input id="firstDonationDate" name="firstDonationDate" type="date" value={form.firstDonationDate} onChange={set('firstDonationDate')} style={inputStyle} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
                  <label>How did you hear about Open Arms? *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6 }}>
                    {ACQUISITION_CHANNELS.map(c => (
                      <div key={c.value} onClick={() => setForm(p => ({ ...p, acquisitionChannel: c.value }))}
                        style={{
                          padding: '10px 12px', borderRadius: 10, border: '2px solid', textAlign: 'center',
                          borderColor: form.acquisitionChannel === c.value ? 'var(--terracotta)' : 'var(--border)',
                          background: form.acquisitionChannel === c.value ? 'rgba(193,105,79,0.06)' : 'white',
                          cursor: 'pointer', fontSize: 13, fontWeight: form.acquisitionChannel === c.value ? 600 : 400,
                          color: form.acquisitionChannel === c.value ? 'var(--terracotta)' : 'var(--navy)',
                          transition: 'all 0.15s'
                        }}>
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Account Setup */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: 18, marginBottom: 6, color: 'var(--navy)' }}>Create Your Account</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Your username will be <strong>{form.email || 'your email address'}</strong>
                </p>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#166534' }}>Account summary</div>
                  <div style={{ color: '#166534' }}>
                    {form.supporterType} · {isOrg ? form.organizationName : `${form.firstName} ${form.lastName}`} · {form.email}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password"><Lock size={13} style={{ marginRight: 4 }} />Password *</label>
                  <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="Minimum 6 characters" style={inputStyle} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat your password" style={inputStyle} />
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginTop: 16 }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {step > 0 && (
              <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', gap: 6 }} onClick={back}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < 2 ? (
              <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 6 }} onClick={next}>
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '14px' }} disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>Sign in</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to public site</Link>
        </p>
      </div>
    </div>
  )
}
