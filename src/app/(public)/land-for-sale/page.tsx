import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { LAUNCH_AREAS, LAUNCH_STATES } from '@/constants/areas'
import { countApprovedByState } from '@/lib/listings'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Land for sale in Nigeria with title documents shown',
  description:
    'Land and property for sale in Lagos, Abuja, Ogun, Oyo and Rivers. Every listing states its title document, C of O, Governor’s Consent, Excision, Gazette or Deed, and names the seller.',
  alternates: { canonical: 'https://plotmarket.ng/land-for-sale' },
  openGraph: {
    title: 'Land for sale in Nigeria with title documents shown',
    description: 'Browse by area. Every listing states its title document and names the seller.',
    url: 'https://plotmarket.ng/land-for-sale',
  },
}

export default async function LandForSaleIndexPage() {
  const counts = await countApprovedByState()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Land for sale in Nigeria, with the papers shown</h1>
      <p className="mt-4 max-w-2xl text-lg text-gray-600">
        Pick an area. Each page shows the listings there, the title documents you should expect to see,
        and where to confirm them before you pay.
      </p>

      <div className="mt-10 space-y-10">
        {LAUNCH_STATES.map((state) => {
          const areas = LAUNCH_AREAS.filter((a) => a.stateSlug === state.slug)
          const count = counts[state.name] ?? 0
          return (
            <section key={state.slug}>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  <Link href={`/land-for-sale/${state.slug}`} className="hover:text-brand-green-700">
                    {state.name}
                  </Link>
                </h2>
                <span className="text-sm text-gray-500">
                  {count} live {count === 1 ? 'listing' : 'listings'}
                </span>
              </div>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {areas.map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={`/land-for-sale/${area.stateSlug}/${area.slug}`}
                      className="flex items-start gap-3 rounded-lg border border-brand-cream-300 bg-white p-4 transition-colors hover:border-brand-green-400"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" aria-hidden="true" />
                      <span>
                        <span className="block font-medium text-gray-900">{area.name}</span>
                        <span className="mt-1 block text-xs text-gray-500">{area.intro.split('. ')[0]}.</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <p className="mt-12 text-sm text-gray-500">
        Plotmarket lists what sellers state. It does not verify title documents. Read the{' '}
        <Link href="/guides/how-to-verify-land-title-in-nigeria" className="text-brand-green-700 underline">
          verification guide
        </Link>{' '}
        before you pay for any land.
      </p>
    </div>
  )
}
