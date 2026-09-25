import { HomePage } from '@/components/home/HomePage'
import { getFeaturedListings } from '@/lib/listings'

/**
 * Server Component. Fetches the featured strip with the anonymous client so
 * the listing titles are in the HTML for crawlers and first paint, and is
 * regenerated at most every five minutes.
 */
export const revalidate = 300

export default async function Page() {
  const featuredProperties = await getFeaturedListings(8)
  return <HomePage featuredProperties={featuredProperties} />
}
