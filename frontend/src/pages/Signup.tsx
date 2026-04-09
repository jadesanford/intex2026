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
const STEPS_TL = ['Tungkol sa Iyo', 'Contact at Lokasyon', 'Pag-setup ng Account']
const t = {
  en: {
    title: 'Create a Supporter Account',
    subtitle: 'Join us in supporting survivors across the Philippines',
    continue: 'Continue',
    back: 'Back',
    creating: 'Creating Account...',
    create: 'Create Account',
    already: 'Already have an account?',
    signin: 'Sign in',
    backSite: '← Back to public site',
    selectSupporterType: 'Please select your supporter type',
    orgNameRequired: 'Organization name is required',
    firstLastRequired: 'First and last name are required',
    emailRequired: 'Email address is required',
    acquisitionRequired: 'Please tell us how you found us',
    passwordRequired: 'Password is required',
    passwordMin: 'Password must be at least 14 characters and include uppercase, lowercase, a number, and a symbol',
    passwordMismatch: 'Passwords do not match',
    registerFailed: 'Registration failed. Please try again.',
    step0Title: 'How do you support Open Arms?',
    step0Desc: 'Select the option that best describes your role.',
    orgName: 'Organization Name *',
    orgNamePlaceholder: "Your organization's name",
    displayNameShown: 'Display Name (shown in communications)',
    displayNamePlaceholder: 'How should we address you?',
    firstName: 'First Name *',
    lastName: 'Last Name *',
    displayName: 'Display Name',
    optionalOverride: '(optional override)',
    step1Title: 'Contact & Location',
    step1Desc: 'How can we reach you and where are you based?',
    emailLabel: 'Email Address *',
    phoneLabel: 'Phone Number',
    optional: '(optional)',
    country: 'Country',
    region: 'Region',
    selectRegion: 'Select region...',
    otherInternational: 'Other / International',
    relationshipType: 'Relationship Type',
    firstDonationDate: 'First Donation Date',
    heardAbout: 'How did you hear about Open Arms? *',
    step2Title: 'Create Your Account',
    usernameWillBe: 'Your username will be',
    yourEmailAddress: 'your email address',
    accountSummary: 'Account summary',
    password: 'Password *',
    passwordPlaceholder: '14+ chars, upper/lower, number, symbol',
    confirmPassword: 'Confirm Password *',
    confirmPasswordPlaceholder: 'Repeat your password',
  },
  tl: {
    title: 'Gumawa ng Supporter Account',
    subtitle: 'Makibahagi sa pagsuporta sa mga survivor sa buong Pilipinas',
    continue: 'Magpatuloy',
    back: 'Bumalik',
    creating: 'Ginagawa ang Account...',
    create: 'Gumawa ng Account',
    already: 'May account na?',
    signin: 'Mag-sign in',
    backSite: '← Bumalik sa site',
    selectSupporterType: 'Piliin ang iyong uri bilang supporter',
    orgNameRequired: 'Kinakailangan ang pangalan ng organisasyon',
    firstLastRequired: 'Kinakailangan ang first name at last name',
    emailRequired: 'Kinakailangan ang email address',
    acquisitionRequired: 'Pakisabi kung paano mo kami nalaman',
    passwordRequired: 'Kinakailangan ang password',
    passwordMin: 'Ang password ay dapat may 14+ na character at may malaking titik, maliit na titik, numero, at simbolo',
    passwordMismatch: 'Hindi magkapareho ang password',
    registerFailed: 'Hindi nagtagumpay ang pagrehistro. Pakisubukan muli.',
    step0Title: 'Paano mo sinusuportahan ang Open Arms?',
    step0Desc: 'Piliin ang pinakanaaangkop na role mo.',
    orgName: 'Pangalan ng Organisasyon *',
    orgNamePlaceholder: 'Pangalan ng iyong organisasyon',
    displayNameShown: 'Display Name (makikita sa komunikasyon)',
    displayNamePlaceholder: 'Paano ka namin tatawagin?',
    firstName: 'Unang Pangalan *',
    lastName: 'Apelyido *',
    displayName: 'Display Name',
    optionalOverride: '(optional na override)',
    step1Title: 'Contact at Lokasyon',
    step1Desc: 'Paano ka namin makokontak at saan ka nakabase?',
    emailLabel: 'Email Address *',
    phoneLabel: 'Numero ng Telepono',
    optional: '(optional)',
    country: 'Bansa',
    region: 'Rehiyon',
    selectRegion: 'Pumili ng rehiyon...',
    otherInternational: 'Iba pa / International',
    relationshipType: 'Uri ng Ugnayan',
    firstDonationDate: 'Unang Petsa ng Donasyon',
    heardAbout: 'Paano mo nalaman ang Open Arms? *',
    step2Title: 'Gawin ang Iyong Account',
    usernameWillBe: 'Ang iyong username ay',
    yourEmailAddress: 'iyong email address',
    accountSummary: 'Buod ng account',
    password: 'Password *',
    passwordPlaceholder: '14+ na character, may upper/lower, numero, simbolo',
    confirmPassword: 'Kumpirmahin ang Password *',
    confirmPasswordPlaceholder: 'Ulitin ang iyong password',
  }
}

function normalizeRegionForApi(region: string) {
  if (!region) return undefined
  const r = region.toLowerCase()
  if (r.includes('mindanao')) return 'Mindanao'
  if (r.includes('visayas')) return 'Visayas'
  if (
    r.includes('luzon') ||
    r.includes('ncr') ||
    r.includes('calabarzon') ||
    r.includes('mimaropa') ||
    r.includes('barmm')
  ) return 'Luzon'
  return undefined
}

export default function Signup({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  const steps = lang === 'tl' ? STEPS_TL : STEPS
  const supporterTypes = lang === 'tl'
    ? [
        { value: 'MonetaryDonor', label: 'Monetary Donor', desc: 'Nagbibigay ako ng pinansyal na donasyon' },
        { value: 'InKindDonor', label: 'In-Kind Donor', desc: 'Nagdo-donate ako ng mga gamit o materyales' },
        { value: 'Volunteer', label: 'Volunteer', desc: 'Ibinibigay ko ang aking oras at serbisyo' },
        { value: 'SkillsContributor', label: 'Skills Contributor', desc: 'Nag-aalok ako ng propesyonal na kasanayan' },
        { value: 'SocialMediaAdvocate', label: 'Social Media Advocate', desc: 'Nagpapalaganap ako ng awareness online' },
        { value: 'PartnerOrganization', label: 'Partner Organization', desc: 'Nakikipag-partner ang aming organisasyon sa Open Arms' },
      ]
    : SUPPORTER_TYPES

  const relationshipTypes = lang === 'tl'
    ? [
        { value: 'Local', label: 'Lokal (Pilipinas)' },
        { value: 'International', label: 'International' },
        { value: 'PartnerOrganization', label: 'Partner Organization' },
      ]
    : RELATIONSHIP_TYPES

  const acquisitionChannels = lang === 'tl'
    ? [
        { value: 'Website', label: 'Website' },
        { value: 'SocialMedia', label: 'Social Media' },
        { value: 'Event', label: 'Event' },
        { value: 'WordOfMouth', label: 'Word of Mouth' },
        { value: 'PartnerReferral', label: 'Partner Referral' },
        { value: 'Church', label: 'Simbahan' },
      ]
    : ACQUISITION_CHANNELS
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
      if (!form.supporterType) { setError(tx.selectSupporterType); return false }
      if (isOrg && !form.organizationName) { setError(tx.orgNameRequired); return false }
      if (!isOrg && (!form.firstName || !form.lastName)) { setError(tx.firstLastRequired); return false }
    }
    if (step === 1) {
      if (!form.email) { setError(tx.emailRequired); return false }
      if (!form.acquisitionChannel) { setError(tx.acquisitionRequired); return false }
    }
    if (step === 2) {
      if (!form.password) { setError(tx.passwordRequired); return false }
      const strongEnough =
        form.password.length >= 14 &&
        /[A-Z]/.test(form.password) &&
        /[a-z]/.test(form.password) &&
        /\d/.test(form.password) &&
        /[^A-Za-z0-9]/.test(form.password)
      if (!strongEnough) { setError(tx.passwordMin); return false }
      if (form.password !== form.confirmPassword) { setError(tx.passwordMismatch); return false }
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
        region: normalizeRegionForApi(form.region),
        country: form.country,
        relationshipType: form.relationshipType,
        acquisitionChannel: form.acquisitionChannel,
        firstDonationDate: form.firstDonationDate || undefined,
      })
      loginWithData(data)
      navigate('/donor')
    } catch (err: any) {
      const details = err?.response?.data?.errors
      const msg = Array.isArray(details) && details.length > 0
        ? details.join(' ')
        : (err?.response?.data?.message || tx.registerFailed)
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
          <h1 style={{ fontSize: 28, marginBottom: 6, color: 'var(--navy)' }}>{tx.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{tx.subtitle}</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
          {steps.map((label, i) => (
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
              {i < steps.length - 1 && (
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
                <h2 style={{ fontSize: 18, marginBottom: 6, color: 'var(--navy)' }}>{tx.step0Title}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{tx.step0Desc}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  {supporterTypes.map(t => (
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
                          <label htmlFor="organizationName"><Building2 size={13} style={{ marginRight: 4 }} />{tx.orgName}</label>
                          <input id="organizationName" name="organizationName" value={form.organizationName} onChange={set('organizationName')} placeholder={tx.orgNamePlaceholder} style={inputStyle} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label htmlFor="displayName">{tx.displayNameShown}</label>
                          <input id="displayName" name="displayName" value={form.displayName} onChange={set('displayName')} placeholder={tx.displayNamePlaceholder} style={inputStyle} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="firstName"><User size={13} style={{ marginRight: 4 }} />{tx.firstName}</label>
                            <input id="firstName" name="firstName" value={form.firstName} onChange={set('firstName')} placeholder="Maria" style={inputStyle} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="lastName">{tx.lastName}</label>
                            <input id="lastName" name="lastName" value={form.lastName} onChange={set('lastName')} placeholder="Santos" style={inputStyle} />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label htmlFor="displayName">{tx.displayName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{tx.optionalOverride}</span></label>
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
                <h2 style={{ fontSize: 18, marginBottom: 6, color: 'var(--navy)' }}>{tx.step1Title}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{tx.step1Desc}</p>

                <div className="form-group">
                  <label htmlFor="email"><Mail size={13} style={{ marginRight: 4 }} />{tx.emailLabel}</label>
                  <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" style={inputStyle} />
                </div>

                <div className="form-group">
                  <label htmlFor="phone"><Phone size={13} style={{ marginRight: 4 }} />{tx.phoneLabel} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{tx.optional}</span></label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+63 9XX XXX XXXX" style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="country"><Globe size={13} style={{ marginRight: 4 }} />{tx.country}</label>
                    <input id="country" name="country" autoComplete="country-name" value={form.country} onChange={set('country')} placeholder="Philippines" style={inputStyle} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="region"><MapPin size={13} style={{ marginRight: 4 }} />{tx.region} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{tx.optional}</span></label>
                    <select id="region" name="region" value={form.region} onChange={set('region')} style={{ ...inputStyle }}>
                      <option value="">{tx.selectRegion}</option>
                      {PH_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="Other">{tx.otherInternational}</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="relationshipType">{tx.relationshipType}</label>
                    <select id="relationshipType" name="relationshipType" value={form.relationshipType} onChange={set('relationshipType')} style={{ ...inputStyle }}>
                      {relationshipTypes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="firstDonationDate">{tx.firstDonationDate} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{tx.optional}</span></label>
                    <input id="firstDonationDate" name="firstDonationDate" type="date" value={form.firstDonationDate} onChange={set('firstDonationDate')} style={inputStyle} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
                  <label>{tx.heardAbout}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6 }}>
                    {acquisitionChannels.map(c => (
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
                <h2 style={{ fontSize: 18, marginBottom: 6, color: 'var(--navy)' }}>{tx.step2Title}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  {tx.usernameWillBe} <strong>{form.email || tx.yourEmailAddress}</strong>
                </p>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#166534' }}>{tx.accountSummary}</div>
                  <div style={{ color: '#166534' }}>
                    {form.supporterType} · {isOrg ? form.organizationName : `${form.firstName} ${form.lastName}`} · {form.email}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password"><Lock size={13} style={{ marginRight: 4 }} />{tx.password}</label>
                  <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder={tx.passwordPlaceholder} style={inputStyle} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="confirmPassword">{tx.confirmPassword}</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder={tx.confirmPasswordPlaceholder} style={inputStyle} />
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
                <ChevronLeft size={16} /> {tx.back}
              </button>
            )}
            {step < 2 ? (
              <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 6 }} onClick={next}>
                {tx.continue} <ChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '14px' }} disabled={loading}>
                {loading ? tx.creating : tx.create}
              </button>
            )}
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 14 }}>
          {tx.already}{' '}
          <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>{tx.signin}</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>{tx.backSite}</Link>
        </p>
      </div>
    </div>
  )
}
