/**
 * Turns a page view beacon into the row stored in public.page_views
 * (migration 0009). Keeps the page address, the referring site, campaign tags,
 * country and device class only: no IP address, no identifier, nothing that
 * ties the row to a person. Returns null for anything not worth counting.
 */

export type VisitRow = {
  path: string
  referrer_host: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  country: string | null
  device: 'mobile' | 'tablet' | 'desktop' | null
}

export type VisitContext = {
  /** Host the site was served from, e.g. plotmarket.ng. */
  siteHost: string
  /** Two letter country from the hosting edge, when known. */
  country: string | null
  /** next/server userAgent().device.type; undefined means a desktop browser. */
  deviceType: string | undefined
  isBot: boolean
}

/** Pages not counted: the admin area and API calls. */
const SKIPPED_PREFIXES = ['/admin', '/api']

function clip(value: string | null | undefined, max: number): string | null {
  const v = (value ?? '').trim()
  return v ? v.slice(0, max) : null
}

function bareHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '')
}

export function toVisitRow(input: unknown, ctx: VisitContext): VisitRow | null {
  if (ctx.isBot || !input || typeof input !== 'object') return null
  const { path: rawPath, referrer, search } = input as Record<string, unknown>
  if (typeof rawPath !== 'string') return null

  const path = rawPath.split(/[?#]/)[0]
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (SKIPPED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return null

  let referrerHost: string | null = null
  if (typeof referrer === 'string' && referrer) {
    try {
      const host = bareHost(new URL(referrer).hostname)
      if (host && host !== bareHost(ctx.siteHost)) referrerHost = clip(host, 200)
    } catch {
      // Not a URL; leave it out.
    }
  }

  const params = new URLSearchParams(typeof search === 'string' ? search : '')
  const country = ctx.country && /^[A-Z]{2}$/.test(ctx.country) ? ctx.country : null
  const device =
    ctx.deviceType === undefined
      ? 'desktop'
      : ctx.deviceType === 'mobile' || ctx.deviceType === 'tablet'
        ? ctx.deviceType
        : null

  return {
    path: path.slice(0, 300),
    referrer_host: referrerHost,
    utm_source: clip(params.get('utm_source'), 100),
    utm_medium: clip(params.get('utm_medium'), 100),
    utm_campaign: clip(params.get('utm_campaign'), 100),
    country,
    device,
  }
}
