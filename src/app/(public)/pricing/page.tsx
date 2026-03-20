import Link from 'next/link'
import { Check, Star } from 'lucide-react'
import { PRICING_PLANS } from '@/constants/pricing'
import { formatNaira } from '@/lib/utils'

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Choose Your Plan
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Start listing for free. Upgrade as your business grows.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-5">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
              plan.highlighted
                ? 'border-brand-gold-400 ring-2 ring-brand-gold-400/50 shadow-lg'
                : 'border-brand-cream-300'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1 rounded-full bg-brand-gold-400 px-3 py-1 text-xs font-bold text-brand-green-900">
                  <Star className="h-3 w-3" /> Most Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-3">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold text-brand-green-700">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-brand-green-700">
                      {formatNaira(plan.price)}
                    </span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {plan.listings === -1 ? 'Unlimited listings' : `${plan.listings} listings`}
              </p>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className={`btn mt-6 w-full ${
                plan.highlighted ? 'btn-secondary font-semibold' : 'btn-outline'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Need a custom solution?</h2>
        <p className="mt-2 text-gray-500">
          Contact us for custom pricing, API access, and white-label solutions.
        </p>
        <button className="btn btn-primary mt-4">Contact Sales</button>
      </div>
    </div>
  )
}
