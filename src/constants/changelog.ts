export const APP_VERSION = '0.6.1'

export interface Release {
  version: string
  date: string
  changes: string[]
}

/** Newest first. Keep entries factual and user facing. */
export const CHANGELOG: Release[] = [
  {
    version: '0.6.1',
    date: '2026-09-28',
    changes: [
      'Your contact details are private. The public sees only sellers with a live listing, and only the contact details shown on that listing. A buyer is visible only to the sellers they have contacted, and to Plotmarket admins.',
      'Plotmarket has a Nigerian phone line: +234 803 217 9317, in the footer, on pricing and on the legal pages.',
      'We now count page visits without cookies or any personal data, so we can see which pages help sellers and buyers. The privacy and cookie policies explain exactly what is kept.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-09-28',
    changes: [
      'Three seller plans. Free Starter: up to 3 active listings, free with no time limit. Business: up to 100 active listings for ₦35,000 per 30 days, paid once through Paystack with no automatic renewal. Founding Developer Pilot: selected developers can request 30 days, one estate and up to 20 active listings, approved by hand.',
      'Plan limits are now enforced on our servers for every way a listing can be created or brought back, not just in the browser.',
      'When a plan ends nothing is deleted. Listings over the new limit are paused, hidden from buyers but kept, and you choose which ones stay live.',
      'Sellers can pause, bring back and mark listings sold from My Listings.',
      'Demo listings are clearly labelled, kept off the home page and search engines, and cannot receive enquiries.',
      'The "Verified" badge is gone from listings. It suggested checks Plotmarket does not make. Title documents are shown as stated by the seller.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-09-13',
    changes: [
      'Land for sale pages for 12 launch areas across Lagos, Abuja, Ogun, Oyo and Rivers, each with the title documents to expect and the registry to confirm them at.',
      'Three buyer guides: Nigerian land title documents explained, how to verify a title step by step, and buying land in Nigeria from abroad.',
      'Pricing simplified to three plans: Free, Professional and Enterprise. Existing Starter and Business subscriptions keep their limits until they end.',
      'Search engines can now find the site: robots.txt, sitemap and structured data added, with a unique title and description on every page.',
    ],
  },
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
