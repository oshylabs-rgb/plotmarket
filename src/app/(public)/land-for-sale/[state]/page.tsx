import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { LAUNCH_STATES, areasForState } from '@/constants/areas'
import { getApprovedListingsForState } from '@/lib/listings'
import { PropertyCard } from '@/components/PropertyCard'

const SITE_URL = 'https://plotmarket.ng'

export const revalidate = 600

export function generateStaticParams() {
  return LAUNCH_STATES.map((s) => ({ state: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params
  const s = LAUNCH_STATES.find((x) => x.slug === state)
  if (!s) return {}
  const url = `${SITE_URL}/land-for-sale/${s.slug}`
  const title = `Land and property for sale in ${s.name} with title documents shown`
  const description = `Browse land, houses and plots for sale in ${s.name}. Every listing states its title document and names the seller. Areas covered: ${areasForState(s.slug).map((a) => a.name).join(', ')}.`
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params
  const s = LAUNCH_STATES.find((x) => x.slug === state)
  if (!s) notFound()
  const areas = areasForState(s.slug)
  const listings = await getApprovedListingsForState(s.name, 60)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Land for sale', item: `${SITE_URL}/land-for-sale` },
      { '@type': 'ListItem', position: 3, name: s.name, item: `${SITE_URL}/land-for-sale/${s.slug}` },
    ],
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/land-for-sale" className="inline-flex items-center gap-1 text-sm text-brand-green-600 hover:text-brand-green-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All areas
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
        Land and property for sale in {s.name}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-gray-600">
        {listings.length} live {listings.length === 1 ? 'listing' : 'listings'}. Every one states its title
        document and names the person selling.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-gray-900">Areas in {s.name}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {areas.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/land-for-sale/${a.stateSlug}/${a.slug}`}
              className="inline-block rounded-full border border-brand-cream-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-brand-green-400 hover:text-brand-green-700"
            >
              {a.name}
            </Link>
          </li>
        ))}
      </ul>

      {listings.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-brand-cream-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No live listings in {s.name} yet</h2>
          <p className="mt-2 text-sm text-gray-600">
            Own land here? Listing is free and takes three minutes. State your title document, add photos and your name.
          </p>
          <Link href="/register" className="btn btn-primary mt-4">List a property free</Link>
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href={`/properties?state=${encodeURIComponent(s.name)}`} className="btn btn-outline">
          Search all {s.name} listings with filters
        </Link>
      </div>
    </div>
  )
}
