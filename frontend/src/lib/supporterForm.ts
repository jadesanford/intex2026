export const SUPPORTER_TYPE_OPTIONS = [
  'MonetaryDonor',
  'InKindDonor',
  'Volunteer',
  'SkillsContributor',
  'SocialMediaAdvocate',
  'PartnerOrganization'
] as const

export const SUPPORTER_RELATIONSHIP_OPTIONS = ['Local', 'International', 'PartnerOrganization'] as const

export const SUPPORTER_ACQUISITION_OPTIONS = [
  'Website',
  'SocialMedia',
  'Event',
  'WordOfMouth',
  'PartnerReferral',
  'Church'
] as const

export const SUPPORTER_STATUS_OPTIONS = ['Active', 'Inactive'] as const

export type SupporterFormState = {
  supporterType: string
  displayName: string
  organizationName: string
  firstName: string
  lastName: string
  relationshipType: string
  region: string
  country: string
  email: string
  phone: string
  status: string
  acquisitionChannel: string
  firstDonationDate: string
}

export function defaultSupporterForm(): SupporterFormState {
  return {
    supporterType: 'MonetaryDonor',
    displayName: '',
    organizationName: '',
    firstName: '',
    lastName: '',
    relationshipType: 'Local',
    region: '',
    country: 'Philippines',
    email: '',
    phone: '',
    status: 'Active',
    acquisitionChannel: 'Website',
    firstDonationDate: ''
  }
}

export function supporterRecordToForm(s: {
  supporterType?: string
  displayName?: string
  organizationName?: string
  firstName?: string
  lastName?: string
  relationshipType?: string
  region?: string
  country?: string
  email?: string
  phone?: string
  status?: string
  acquisitionChannel?: string
  firstDonationDate?: string
}): SupporterFormState {
  return {
    supporterType: s.supporterType || 'MonetaryDonor',
    displayName: s.displayName ?? '',
    organizationName: s.organizationName ?? '',
    firstName: s.firstName ?? '',
    lastName: s.lastName ?? '',
    relationshipType: s.relationshipType || 'Local',
    region: s.region ?? '',
    country: s.country || 'Philippines',
    email: s.email ?? '',
    phone: s.phone ?? '',
    status: s.status || 'Active',
    acquisitionChannel: s.acquisitionChannel || 'Website',
    firstDonationDate: s.firstDonationDate?.slice(0, 10) ?? ''
  }
}

export function formToSupporterPayload(form: SupporterFormState): Record<string, unknown> {
  return {
    supporterType: form.supporterType,
    displayName: form.displayName.trim() || null,
    organizationName: form.organizationName.trim() || null,
    firstName: form.firstName.trim() || null,
    lastName: form.lastName.trim() || null,
    relationshipType: form.relationshipType,
    region: form.region.trim() || null,
    country: form.country.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    status: form.status,
    acquisitionChannel: form.acquisitionChannel,
    firstDonationDate: form.firstDonationDate.trim() || null
  }
}

export function canSaveSupporterForm(form: SupporterFormState): boolean {
  const d = form.displayName.trim()
  const o = form.organizationName.trim()
  const f = form.firstName.trim()
  const l = form.lastName.trim()
  return !!(d || o || (f && l))
}
