export const APP_VERSION = '0.4.0'

export interface Release {
  version: string
  date: string
  changes: string[]
}

/** Newest first. Keep entries factual and user facing. */
export const CHANGELOG: Release[] = [
  {
    version: '0.4.0',
    date: '2026-08-23',
    changes: [
      'Sellers can upload 360 degree photos and video tours. Buyers can look around a property from their phone before travelling to see it.',
      'Every listing now states its title document, from Certificate of Occupancy through to Family Receipt, and buyers can filter on it.',
      'Photos now upload the moment you add them, so a listing can no longer be saved with the photos silently dropped.',
      'Search now matches on title, area, city, state and description, and the state links on the home page work.',
      'Admin panel now requires an admin account. Previously any signed in user could open it.',
      'New look across the site, and layout fixes for small phone screens.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-04-09',
    changes: [
      'Privacy Policy, Terms of Service and Cookie Policy published, written against the NDPA 2023 and the Land Use Act.',
      'Cookie consent banner added.',
      'Support contact shown on registration, login and the dashboard.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-03-26',
    changes: [
      'Paystack subscriptions live, with plan selection, checkout and webhook handling.',
      'Listing limits now enforced against your active plan.',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-03-20',
    changes: [
      'Plotmarket opens. Property listings across all 36 states and the FCT, with accounts for individuals, agents and developers.',
    ],
  },
]
