import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { BUSINESS_PLAN, PILOT_EXPIRY_TERMS } from '@/constants/plans'
import { formatNaira } from '@/lib/utils'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://plotmarket.ng'
const WARN_DAYS = 7

function watDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/**
 * Daily, from Vercel Cron (vercel.json). The database also runs the same
 * expiry every 15 minutes through pg_cron where available; this is the
 * fallback and the only place reminder emails are sent. Safe to run twice.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: expired, error: expiryError } = await supabase.rpc('run_plan_expiry')
  if (expiryError) {
    console.error('plan-expiry: run_plan_expiry failed', expiryError)
    return NextResponse.json({ error: 'Expiry failed' }, { status: 500 })
  }

  const now = new Date()
  const horizon = new Date(now.getTime() + WARN_DAYS * 24 * 60 * 60 * 1000)
  const { data: due, error: dueError } = await supabase
    .from('pilots')
    .select('id, project_name, ends_at, profile:profiles!pilots_user_id_fkey(email, full_name)')
    .eq('status', 'active')
    .is('expiry_warning_sent_at', null)
    .gt('ends_at', now.toISOString())
    .lte('ends_at', horizon.toISOString())
  if (dueError) {
    console.error('plan-expiry: reminder lookup failed', dueError)
    return NextResponse.json({ error: 'Reminder lookup failed' }, { status: 500 })
  }

  let warned = 0
  for (const pilot of (due ?? []) as unknown as {
    id: string
    project_name: string
    ends_at: string
    profile: { email: string; full_name: string | null } | null
  }[]) {
    if (!pilot.profile?.email) continue
    const when = watDate(pilot.ends_at)
    const sent = await sendEmail({
      to: pilot.profile.email,
      subject: `Your Plotmarket pilot ends on ${when}`,
      text: [
        `Hello${pilot.profile.full_name ? ` ${pilot.profile.full_name}` : ''},`,
        '',
        `Your Founding Developer Pilot for ${pilot.project_name} ends on ${when} (Lagos time).`,
        '',
        PILOT_EXPIRY_TERMS,
        '',
        `Business is ${formatNaira(BUSINESS_PLAN.price)} per ${BUSINESS_PLAN.periodDays} days for up to ${BUSINESS_PLAN.listings} active listings. It is paid once through Paystack and does not renew automatically. Your Plan page: ${APP_URL}/dashboard/subscription`,
        '',
        `To choose which 3 listings stay live instead, go to ${APP_URL}/dashboard/listings`,
        '',
        'Plotmarket',
      ].join('\n'),
    })
    if (!sent) continue
    const { error: markError } = await supabase
      .from('pilots')
      .update({ expiry_warning_sent_at: now.toISOString() })
      .eq('id', pilot.id)
    if (markError) console.error('plan-expiry: could not mark reminder sent', pilot.id, markError)
    else warned += 1
  }

  return NextResponse.json({ expired: (expired as unknown[] | null)?.length ?? 0, warned })
}
