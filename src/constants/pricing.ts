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
      '3 property listings',
      'Basic property details',
      'Email support',
      'Standard visibility',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Starter',
    planId: 'starter',
    price: 12000,
    period: '/month',
    listings: 20,
    featuredListings: 3,
    features: [
      '20 property listings',
      '3 featured listings',
      'Featured badge',
      'Analytics dashboard',
      'Priority support',
    ],
    cta: 'Subscribe',
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
      '100 property listings',
      '20 featured listings',
      'Verified badge',
      'Virtual tour support',
      'Lead generation tools',
      'Advanced analytics',
    ],
    cta: 'Subscribe',
    highlighted: true,
  },
  {
    name: 'Business',
    planId: 'business',
    price: 80000,
    period: '/month',
    listings: 500,
    featuredListings: 100,
    features: [
      '500 property listings',
      '100 featured listings',
      'Bulk upload tools',
      'Team collaboration (5 users)',
      'API access',
      'All Professional features',
    ],
    cta: 'Subscribe',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    planId: 'enterprise',
    price: 0,
    period: 'Custom pricing',
    listings: -1,
    featuredListings: -1,
    features: [
      'Unlimited listings',
      'Unlimited featured listings',
      'White-label solution',
      'Custom integrations',
      'SLA guarantee',
      'Unlimited team members',
      'On-premise deployment option',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

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
  return plan?.listings ?? 3 // default to free plan limit
}
