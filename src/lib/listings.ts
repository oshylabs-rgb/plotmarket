import { createPublicClient } from '@/lib/supabase/public'
import type { LaunchArea } from '@/constants/areas'
import { SELLER_CONTACT_COLUMNS, type Property, type SellerContact } from '@/types/database'

/**
 * Public, approved only listing reads for server rendered pages.
 * Every function returns an empty result when the anon client is unavailable
 * so pages still render their editorial content.
 *
 * Demo listings are samples, not inventory. They appear on /properties with a
 * "Demo listing, not for sale" label but never on the home page, area pages,
 * state counts or the sitemap. They are filtered here rather than in the
 * query so these pages keep working on a database without the is_demo column.
 */

export function isRealInventory(p: Pick<Property, 'is_demo'>): boolean {
  return p.is_demo !== true
}

const FEED_ORDER = [
  { column: 'is_featured', ascending: false },
  { column: 'created_at', ascending: false },
] as const

/** Approved listings, featured first, newest first. Used by /properties. */
export async function getApprovedListings(limit = 500): Promise<Property[]> {
  const supabase = createPublicClient()
  if (!supabase) return []
  let query = supabase.from('properties').select('*').eq('status', 'approved')
  for (const o of FEED_ORDER) query = query.order(o.column, { ascending: o.ascending })
  const { data } = await query.limit(limit)
  return (data as Property[] | null) ?? []
}

/** The home page strip: the newest real approved listings, featured first. */
export async function getFeaturedListings(limit = 8): Promise<Property[]> {
  return (await getApprovedListings(limit + 20)).filter(isRealInventory).slice(0, limit)
}

/**
 * One approved listing plus the profile of the person who listed it.
 * Returns null when the listing does not exist or is not approved, which the
 * page turns into a 404. Owners see their pending listings in the dashboard.
 */
/**
 * For a listing that is not live: 'unavailable' when it exists but is paused,
 * sold or not yet approved, null when there is no such listing.
 */
export async function getListingAvailability(id: string): Promise<'live' | 'unavailable' | null> {
  const supabase = createPublicClient()
  if (!supabase) return null
  const { data, error } = await supabase.rpc('listing_availability', { p_id: id })
  if (error) return null
  return (data as 'live' | 'unavailable' | null) ?? null
}

export async function getApprovedPropertyWithSeller(
  id: string
): Promise<{ property: Property; seller: SellerContact | null } | null> {
  const supabase = createPublicClient()
  if (!supabase) return null
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()
  if (!property) return null
  const { data: seller } = await supabase
    .from('profiles')
    .select(SELLER_CONTACT_COLUMNS)
    .eq('id', (property as Property).user_id)
    .maybeSingle()
  return { property: property as Property, seller: (seller as SellerContact | null) ?? null }
}

export async function getApprovedListingsForState(state: string, limit = 200): Promise<Property[]> {
  const supabase = createPublicClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'approved')
    .eq('state', state)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  return ((data as Property[] | null) ?? []).filter(isRealInventory)
}

export function filterListingsForArea(listings: Property[], area: LaunchArea): Property[] {
  const terms = area.match.map((t) => t.toLowerCase())
  return listings.filter((p) => {
    const haystack = `${p.city ?? ''} ${p.location ?? ''} ${p.title ?? ''}`.toLowerCase()
    return terms.some((t) => haystack.includes(t))
  })
}

export async function countApprovedByState(): Promise<Record<string, number>> {
  const supabase = createPublicClient()
  if (!supabase) return {}
  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'approved')
    .limit(5000)
  const counts: Record<string, number> = {}
  for (const row of (data as Property[] | null) ?? []) {
    if (!isRealInventory(row)) continue
    const s = row.state
    counts[s] = (counts[s] ?? 0) + 1
  }
  return counts
}
