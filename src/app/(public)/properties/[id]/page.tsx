import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PropertyDetail } from '@/components/properties/PropertyDetail'
import { getApprovedPropertyWithSeller, getListingAvailability } from '@/lib/listings'

/**
 * Server Component. The listing and its seller are fetched with the anonymous
 * client and rendered into the HTML, including the seller name, so crawlers
 * see the same page a buyer does. Metadata and the RealEstateListing JSON-LD
 * live in ./layout.tsx. Regenerated at most every five minutes.
 */
export const revalidate = 300

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getApprovedPropertyWithSeller(id)
  if (result) return <PropertyDetail property={result.property} agent={result.seller} />

  // A paused, sold or unreviewed listing still exists; say so plainly
  // instead of a bare 404, without showing any of its details.
  if ((await getListingAvailability(id)) === 'unavailable') {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">This listing is no longer listed</h1>
        <p className="mt-3 text-gray-600">
          The seller has sold it, taken it down, or it is not currently published. Enquiries are closed.
        </p>
        <Link href="/properties" className="btn btn-primary mt-6 inline-block">
          Browse current listings
        </Link>
      </div>
    )
  }
  notFound()
}
