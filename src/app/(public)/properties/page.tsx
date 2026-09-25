import { PropertiesBrowser } from '@/components/properties/PropertiesBrowser'
import { getApprovedListings } from '@/lib/listings'

/**
 * Server Component. All approved listings are fetched here and rendered into
 * the HTML; filtering stays on the client. Regenerated at most every five
 * minutes. Metadata lives in ./layout.tsx.
 */
export const revalidate = 300

export default async function Page() {
  const properties = await getApprovedListings()
  return <PropertiesBrowser initialProperties={properties} />
}
