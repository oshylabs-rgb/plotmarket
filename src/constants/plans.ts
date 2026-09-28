/**
 * The one place seller plans are defined for the app: names, prices, limits
 * and the exact public copy. Enforcement lives in the database
 * (supabase/migrations/0007_plans_and_pilots.sql, plan_listing_limit and the
 * listing_allowance trigger); a unit test keeps the limits below in step
 * with it. Owner-approved terms: docs/PLAN_AUDIT_2026-09-27.md section F.
 *
 * Only list a feature here once it works end to end.
 */

/** Plan keys as the database reports them from plan_status(). */
export type PlanKey = 'basic' | 'pilot' | 'professional' | 'starter' | 'business' | 'enterprise'

/** Maximum active (pending or approved) listings. null means no limit. */
export const LISTING_LIMITS: Record<PlanKey, number | null> = {
  basic: 3,
  pilot: 20,
  professional: 100,
  starter: 20, // legacy, honoured to its end date
  business: 500, // legacy, honoured to its end date
  enterprise: null,
}

export const PLAN_NAMES: Record<PlanKey, string> = {
  basic: 'Free Starter',
  pilot: 'Founding Developer Pilot',
  professional: 'Business',
  starter: 'Starter (legacy plan)',
  business: 'Business 500 (legacy plan)',
  enterprise: 'Enterprise',
}

export const PILOT_DAYS = 30

/** A plan that can be bought online through Paystack. */
export interface PurchasablePlan {
  planId: 'professional'
  name: string
  /** Naira, charged once per period. */
  price: number
  periodDays: number
  listings: number
}

/**
 * Business is internally 'professional' because live subscriptions and
 * Paystack metadata already carry that id. The legacy 'business' id is the old
 * 500-listing plan and must not be reused.
 */
export const BUSINESS_PLAN: PurchasablePlan = {
  planId: 'professional',
  name: PLAN_NAMES.professional,
  price: 35000,
  periodDays: 30,
  listings: LISTING_LIMITS.professional as number,
}

export const PURCHASABLE_PLANS: PurchasablePlan[] = [BUSINESS_PLAN]

export function getPurchasablePlan(planId: string): PurchasablePlan | undefined {
  return PURCHASABLE_PLANS.find((p) => p.planId === planId)
}

/** What happens when a pilot ends. Shown before a seller requests one. */
export const PILOT_EXPIRY_TERMS =
  'When the 30 days end, nothing is deleted and nothing is charged. Your 3 earliest published listings stay live on Free Starter. The rest are paused: hidden from buyers and search, but kept with all their photos and details. Upgrade to Business to bring them back, or choose which 3 stay live.'

export interface PublicPlan {
  key: 'basic' | 'pilot' | 'professional'
  name: string
  priceLabel: string
  periodLabel?: string
  summary: string
  features: string[]
  cta: { label: string; href: string }
  highlighted: boolean
}

export const PUBLIC_PLANS: PublicPlan[] = [
  {
    key: 'basic',
    name: PLAN_NAMES.basic,
    priceLabel: 'Free',
    periodLabel: 'No time limit',
    summary: 'List up to 3 properties free.',
    features: [
      'Up to 3 active listings',
      'Photos, video and 360° media',
      'Title-document type stated by the seller',
      'Your name and phone shown to buyers',
    ],
    cta: { label: 'List free', href: '/register' },
    highlighted: false,
  },
  {
    key: 'pilot',
    name: PLAN_NAMES.pilot,
    priceLabel: 'Free',
    periodLabel: `${PILOT_DAYS} days, by approval`,
    summary:
      'Selected developers can request a 30-day pilot for one estate and up to 20 active listings. Approval required. No card or automatic charge.',
    features: [
      'One estate or project',
      'Up to 20 active listings for 30 days from approval',
      'One assisted setup session with our team',
      'No card, no automatic charge',
    ],
    cta: { label: 'Request a pilot', href: '/register?plan=pilot' },
    highlighted: false,
  },
  {
    key: 'professional',
    name: BUSINESS_PLAN.name,
    priceLabel: '₦35,000',
    periodLabel: 'per 30 days',
    summary: 'For agencies and developers listing at volume.',
    features: [
      `Up to ${BUSINESS_PLAN.listings} active listings`,
      'Photos, video and 360° media',
      'Title-document type stated by the seller',
      'Email support',
      'Paid once through Paystack. Does not renew automatically.',
    ],
    cta: { label: 'Choose Business', href: '/register?plan=business' },
    highlighted: true,
  },
]

export function planName(key: string | null | undefined): string {
  return (key && PLAN_NAMES[key as PlanKey]) || PLAN_NAMES.basic
}

/** Turn a database refusal into something a seller can act on. */
export function friendlyListingError(message: string): string {
  if (message.startsWith('LISTING_LIMIT')) {
    return `${message.replace(/^LISTING_LIMIT:\s*/, '').replace(/^your/, 'Your')} Pause or mark sold a listing you no longer need, or upgrade on the Plan page.`
  }
  if (message.startsWith('PILOT_SCOPE')) {
    return message.replace(/^PILOT_SCOPE:\s*/, '').replace(/^pilot/, 'Pilot').replace(/^a Founding/, 'A Founding')
  }
  return message
}
