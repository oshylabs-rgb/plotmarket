import { notFound } from 'next/navigation'
import { PropertyDetail } from '@/components/properties/PropertyDetail'
import { getApprovedPropertyWithSeller } from '@/lib/listings'

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
  if (!result) notFound()
  return <PropertyDetail property={result.property} agent={result.seller} />
}
