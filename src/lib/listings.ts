import { createPublicClient } from '@/lib/supabase/public'
import type { LaunchArea } from '@/constants/areas'
import type { Profile, Property } from '@/types/database'

/**
 * Public, approved only listing reads for server rendered pages.
 * Every function returns an empty result when the anon client is unavailable
 * so pages still render their editorial content.
 */

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

/** The home page strip: the first N approved listings, featured first. */
export async function getFeaturedListings(limit = 8): Promise<Property[]> {
  return getApprovedListings(limit)
}

/**
 * One approved listing plus the profile of the person who listed it.
 * Returns null when the listing does not exist or is not approved, which the
 * page turns into a 404. Owners see their pending listings in the dashboard.
 */
export async function getApprovedPropertyWithSeller(
  id: string
): Promise<{ property: Property; seller: Profile | null } | null> {
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
    .select('*')
    .eq('id', (property as Property).user_id)
    .maybeSingle()
  return { property: property as Property, seller: (seller as Profile | null) ?? null }
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
  return (data as Property[] | null) ?? []
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
    .select('state')
    .eq('status', 'approved')
    .limit(5000)
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const s = (row as { state: string }).state
    counts[s] = (counts[s] ?? 0) + 1
  }
  return counts
}
