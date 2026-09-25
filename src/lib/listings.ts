import { createPublicClient } from '@/lib/supabase/public'
import type { LaunchArea } from '@/constants/areas'
import type { Property } from '@/types/database'

/**
 * Public, approved only listing reads for server rendered landing pages.
 * Returns an empty array when the anon client is unavailable so pages still
 * render their editorial content.
 */
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
