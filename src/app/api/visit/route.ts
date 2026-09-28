import { NextRequest, userAgent } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { toVisitRow } from '@/lib/visits'

const MAX_BODY_BYTES = 2048

function sameHost(origin: string | null, host: string): boolean {
  if (!origin) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/**
 * Page view beacon from VisitBeacon. Counts production traffic only and always
 * answers 204, so it tells a caller nothing. Requests from another site are
 * ignored. See src/lib/visits.ts for what is kept.
 */
export async function POST(request: NextRequest) {
  const done = new Response(null, { status: 204 })

  if (process.env.VERCEL_ENV !== 'production' || !process.env.SUPABASE_SERVICE_ROLE_KEY) return done
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host || !sameHost(request.headers.get('origin'), host)) return done

  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return done
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return done
  }

  const ua = userAgent(request)
  const row = toVisitRow(body, {
    siteHost: host.split(':')[0],
    country: request.headers.get('x-vercel-ip-country'),
    deviceType: ua.device.type,
    isBot: ua.isBot || !ua.browser.name,
  })
  if (!row) return done

  const { error } = await createAdminClient().from('page_views').insert(row)
  if (error) console.error('[visit] insert failed', error.code)
  return done
}
