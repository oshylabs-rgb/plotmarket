import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export const dynamic = 'force-dynamic'

type Check = 'ok' | 'missing' | 'error'

/**
 * Health of the plan migrations, checked through the same anonymous client the
 * public pages use. Answers only yes or no per migration and returns no rows,
 * so it is safe to leave public and to poll from monitoring.
 *
 *   0006  'paused' is a valid property_status (a filter on it is accepted)
 *   0007  properties has is_demo, and listing_availability() exists
 */
export async function GET() {
  const supabase = createPublicClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  // An unknown enum value is rejected with 22P02 before RLS is applied.
  const paused = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'paused')
  const pausedStatus: Check = !paused.error
    ? 'ok'
    : paused.error.code === '22P02'
      ? 'missing'
      : 'error'

  const demo = await supabase.from('properties').select('is_demo').limit(1)
  const demoColumn: Check = !demo.error
    ? 'ok'
    : demo.error.code === '42703' || demo.error.code === 'PGRST204'
      ? 'missing'
      : 'error'

  const availability = await supabase.rpc('listing_availability', {
    p_id: '00000000-0000-0000-0000-000000000000',
  })
  const availabilityFn: Check = !availability.error
    ? 'ok'
    : availability.error.code === 'PGRST202' || availability.error.code === '42883'
      ? 'missing'
      : 'error'

  const checks = {
    migration_0006_paused_status: pausedStatus,
    migration_0007_is_demo_column: demoColumn,
    migration_0007_listing_availability: availabilityFn,
  }
  const healthy = Object.values(checks).every((c) => c === 'ok')
  return NextResponse.json(
    { healthy, checks, checked_at: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
