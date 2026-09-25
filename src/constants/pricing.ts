export interface PricingPlan {
  name: string
  planId: string
  price: number
  period: string
  listings: number
  featuredListings: number
  features: string[]
  cta: string
  highlighted: boolean
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Free',
    planId: 'free',
    price: 0,
    period: 'Free forever',
    listings: 3,
    featuredListings: 0,
    features: [
      '3 live listings',
      'Title document stated on every listing',
      'Your name and phone shown to buyers',
      'Photos and a video walkthrough',
      'Email support',
    ],
    cta: 'List free',
    highlighted: false,
  },
  {
    name: 'Professional',
    planId: 'professional',
    price: 35000,
    period: '/month',
    listings: 100,
    featuredListings: 20,
    features: [
      '100 live listings',
      '20 featured listings',
      '360 degree photos and video tours',
      'Verified lister badge',
      'Enquiry analytics',
      'Priority support',
      'No push ups, no slot fees',
    ],
    cta: 'Subscribe',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    planId: 'enterprise',
    price: 0,
    period: 'Custom pricing',
    listings: -1,
    featuredListings: -1,
    features: [
      'Unlimited listings and featured slots',
      'Developer page with estate 360 tour',
      'Bulk upload and team seats',
      'API access',
      'Monthly enquiry report by plot and buyer country',
      'Dedicated support',
    ],
    cta: 'Talk to us',
    highlighted: false,
  },
]

/**
 * Plans that were sold before the move to three tiers. They are no longer
 * offered, but an account that still carries one keeps its listing limit until
 * the subscription ends. Paystack references to these ids resolve here.
 */
export const LEGACY_PLAN_LIMITS: Record<string, { listings: number; featuredListings: number }> = {
  starter: { listings: 20, featuredListings: 3 },
  business: { listings: 500, featuredListings: 100 },
}

/**
 * Get the plan config by planId
 */
export function getPlanByPlanId(planId: string): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.planId === planId)
}

/**
 * Get the listing limit for a given plan. Returns -1 for unlimited.
 */
export function getListingLimit(planId: string): number {
  const plan = getPlanByPlanId(planId)
  if (plan) return plan.listings
  const legacy = LEGACY_PLAN_LIMITS[planId]
  return legacy?.listings ?? 3 // default to free plan limit
}
