import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ScrollText, Landmark } from 'lucide-react'
import { LAUNCH_AREAS, findArea, areasForState } from '@/constants/areas'
import { filterListingsForArea, getApprovedListingsForState } from '@/lib/listings'
import { PropertyCard } from '@/components/PropertyCard'

const SITE_URL = 'https://plotmarket.ng'

export const revalidate = 600

export function generateStaticParams() {
  return LAUNCH_AREAS.map((a) => ({ state: a.stateSlug, area: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; area: string }>
}): Promise<Metadata> {
  const { state, area } = await params
  const a = findArea(state, area)
  if (!a) return {}
  const url = `${SITE_URL}/land-for-sale/${a.stateSlug}/${a.slug}`
  const title = `Land for sale in ${a.name}, ${a.state}, with title documents shown`
  const description = `${a.intro.split('. ')[0]}. Every Plotmarket listing in ${a.name} states its title document and names the seller, with notes on which titles to expect and where to confirm them.`
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
}

export default async function AreaPage({ params }: { params: Promise<{ state: string; area: string }> }) {
  const { state, area } = await params
  const a = findArea(state, area)
  if (!a) notFound()

  const stateListings = await getApprovedListingsForState(a.state, 200)
  const areaListings = filterListingsForArea(stateListings, a)
  const fallback = areaListings.length === 0 ? stateListings.slice(0, 8) : []
  const siblings = areasForState(a.stateSlug).filter((x) => x.slug !== a.slug)
  const url = `${SITE_URL}/land-for-sale/${a.stateSlug}/${a.slug}`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Land for sale', item: `${SITE_URL}/land-for-sale` },
        { '@type': 'ListItem', position: 3, name: a.state, item: `${SITE_URL}/land-for-sale/${a.stateSlug}` },
        { '@type': 'ListItem', position: 4, name: a.name, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Land for sale in ${a.name}`,
      numberOfItems: areaListings.length,
      itemListElement: areaListings.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/properties/${p.id}`,
        name: p.title,
      })),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link
        href={`/land-for-sale/${a.stateSlug}`}
        className="inline-flex items-center gap-1 text-sm text-brand-green-600 hover:text-brand-green-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {a.state}
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
        Land for sale in {a.name}, {a.state}
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-gray-600">{a.intro}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-brand-cream-300 bg-white p-5">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-brand-green-600" aria-hidden="true" />
            <h2 className="font-semibold text-gray-900">Titles you will see here</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{a.titleNotes}</p>
        </div>
        <div className="rounded-xl border border-brand-cream-300 bg-white p-5">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-brand-green-600" aria-hidden="true" />
            <h2 className="font-semibold text-gray-900">Where to confirm the title</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{a.registry}</p>
          <Link
            href="/guides/how-to-verify-land-title-in-nigeria"
            className="mt-3 inline-block text-sm font-medium text-brand-green-700 underline"
          >
            Step by step verification guide
          </Link>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {areaListings.length > 0
              ? `${areaListings.length} live ${areaListings.length === 1 ? 'listing' : 'listings'} in ${a.name}`
              : `No live listings in ${a.name} yet`}
          </h2>
          <Link
            href={`/properties?state=${encodeURIComponent(a.state)}&q=${encodeURIComponent(a.name)}`}
            className="text-sm font-medium text-brand-green-700 hover:underline"
          >
            Search with filters
          </Link>
        </div>

        {areaListings.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {areaListings.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-brand-cream-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-600">
              Own land in {a.name}? Listing is free and takes three minutes. State your title document,
              add photos and your name, and buyers see the paper before they call.
            </p>
            <Link href="/register" className="btn btn-primary mt-4">List a property free</Link>
          </div>
        )}

        {fallback.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-900">Elsewhere in {a.state}</h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {fallback.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </section>

      {siblings.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">Other areas in {a.state}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {siblings.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/land-for-sale/${s.stateSlug}/${s.slug}`}
                  className="inline-block rounded-full border border-brand-cream-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:border-brand-green-400 hover:text-brand-green-700"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 text-sm text-gray-500">
        Listings are submitted by sellers. Plotmarket shows the stated title document and does not verify it.
        Confirm at the registry named above before you pay.
      </p>
    </div>
  )
}
