import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const RANGE_URL = 'https://api.pwnedpasswords.com/range/'
const TIMEOUT_MS = 3000

/**
 * Relays a Pwned Passwords range lookup for the breached-password check in
 * src/lib/passwords.ts. It receives only the first 5 hex characters of a
 * SHA-1 hash, never a password or a full hash, and returns the list of
 * breached hash suffixes that share them. Public data, so responses are cached.
 * Any upstream problem answers 503, which the browser treats as "could not
 * check" and lets the password through.
 */
export async function GET(request: NextRequest) {
  const prefix = (request.nextUrl.searchParams.get('prefix') ?? '').toUpperCase()
  if (!/^[0-9A-F]{5}$/.test(prefix)) {
    return new NextResponse('prefix must be 5 hex characters', { status: 400 })
  }

  try {
    const upstream = await fetch(`${RANGE_URL}${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!upstream.ok) return new NextResponse('unavailable', { status: 503 })
    return new NextResponse(await upstream.text(), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  } catch {
    return new NextResponse('unavailable', { status: 503 })
  }
}
