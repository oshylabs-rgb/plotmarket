import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { PILOT_EXPIRY_TERMS, PUBLIC_PLANS } from '@/constants/plans'

export const metadata: Metadata = {
  title: 'Pricing for listers',
  description:
    'List up to 3 properties free. Business is ₦35,000 per 30 days for up to 100 active listings, paid once with no automatic renewal. Selected developers can request a pilot for one estate.',
  alternates: { canonical: 'https://plotmarket.ng/pricing' },
  openGraph: {
    title: 'Plotmarket pricing for listers',
    description: 'Free for up to 3 listings. Business ₦35,000 per 30 days for up to 100. Developer pilot by approval.',
    url: 'https://plotmarket.ng/pricing',
  },
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Pricing for listers</h1>
        <p className="mt-3 text-lg text-gray-500">
          List up to 3 properties free. Pay only when you list at volume. No push ups, no slot fees.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
        {PUBLIC_PLANS.map((plan) => (
          <div
            key={plan.key}
            data-plan={plan.key}
            className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
              plan.highlighted ? 'border-brand-gold-400 ring-2 ring-brand-gold-400/50' : 'border-brand-cream-300'
            }`}
          >
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
              <p className="mt-3">
                <span className="text-3xl font-bold text-brand-green-700">{plan.priceLabel}</span>
              </p>
              {plan.periodLabel && <p className="mt-1 text-sm text-gray-500">{plan.periodLabel}</p>}
              <p className="mt-3 text-sm text-gray-700">{plan.summary}</p>
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-500" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.cta.href}
              className={`btn mt-6 w-full ${plan.highlighted ? 'btn-secondary font-semibold' : 'btn-outline'}`}
            >
              {plan.cta.label}
            </Link>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
        <section className="rounded-xl bg-brand-cream-50 p-6" aria-labelledby="pilot-ends">
          <h2 id="pilot-ends" className="text-base font-semibold text-gray-900">
            What happens when a developer pilot ends
          </h2>
          <p className="mt-2 text-sm text-gray-700">{PILOT_EXPIRY_TERMS}</p>
          <p className="mt-2 text-sm text-gray-700">
            Each company can have one pilot. The 30 days start when we approve it, not when you sign up.
          </p>
        </section>
        <section className="rounded-xl bg-brand-cream-50 p-6" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-base font-semibold text-gray-900">How listing works on every plan</h2>
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            <li>
              An active listing is one that is live or waiting for review. Paused, sold and rejected listings do
              not count.
            </li>
            <li>
              We review every listing before it goes live. That review is not a check of ownership or title. The
              title-document type on a listing is stated by the seller.
            </li>
            <li>
              Paystack processes the plan fee only. Plotmarket does not take, hold or protect payments for
              property.
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Larger volumes?</h2>
        <p className="mt-2 text-gray-500">If you need more than 100 active listings, talk to us.</p>
        <a
          href="mailto:arnold.oshenye@oshylabs.eu?subject=Plotmarket%20volume%20listing"
          className="btn btn-primary mt-4 inline-block"
        >
          Talk to us
        </a>
      </div>
    </div>
  )
}
