/** Shown only when analytics queries succeed but the database has no rows (or failed fetch returns []). */

export const DEMO_DONATION_MONTHLY = [
  { month: '2025-11', total: 185_000, count: 14 },
  { month: '2025-12', total: 242_000, count: 19 },
  { month: '2026-01', total: 198_000, count: 16 },
  { month: '2026-02', total: 267_000, count: 22 },
  { month: '2026-03', total: 311_000, count: 25 },
  { month: '2026-04', total: 156_000, count: 11 },
]

export const DEMO_RESIDENT_BY_STATUS = [
  { name: 'Active', value: 32 },
  { name: 'Closed', value: 9 },
  { name: 'Transferred', value: 4 },
]

export const DEMO_RESIDENT_BY_CATEGORY = [
  { name: 'Abuse', value: 18 },
  { name: 'Trafficking', value: 11 },
  { name: 'Neglect', value: 8 },
  { name: 'Exploitation', value: 6 },
  { name: 'Other', value: 2 },
]

export const DEMO_SUB_CATEGORIES = {
  trafficked: 11,
  sexualAbuse: 14,
  physicalAbuse: 9,
  osaec: 7,
}

export const DEMO_SAFEHOUSE_COMPARISON = [
  {
    name: 'Open Arms Manila Center',
    currentOccupancy: 18,
    capacityGirls: 24,
    active: 16,
    occupancyRate: 75,
  },
  {
    name: 'Open Arms Cebu Haven',
    currentOccupancy: 12,
    capacityGirls: 20,
    active: 11,
    occupancyRate: 60,
  },
  {
    name: 'Open Arms Davao Home',
    currentOccupancy: 9,
    capacityGirls: 16,
    active: 8,
    occupancyRate: 56.3,
  },
]

export const DEMO_DASHBOARD = {
  residents: {
    total: 45,
    active: 32,
    closed: 9,
    transferred: 4,
    highRisk: 9,
    critical: 2,
    reintegrationInProgress: 6,
    reintegrationCompleted: 11,
  },
  donations: {
    thisMonth: 156_000,
    total: 1_359_000,
    count: 107,
    monetary: 89,
    inKind: 18,
  },
}
