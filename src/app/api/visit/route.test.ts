import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const inserted: unknown[] = []
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: async (row: unknown) => {
        inserted.push(row)
        return { error: null }
      },
    }),
  }),
}))

const { POST } = await import('./route')

const CHROME =
  'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'

function beacon(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('https://plotmarket.ng/api/visit', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      host: 'plotmarket.ng',
      origin: 'https://plotmarket.ng',
      'user-agent': CHROME,
      'x-vercel-ip-country': 'NG',
      ...headers,
    },
  })
}

beforeEach(() => {
  inserted.length = 0
  vi.stubEnv('VERCEL_ENV', 'production')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test')
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/visit', () => {
  it('records a production page view and answers 204', async () => {
    const res = await POST(beacon({ path: '/pricing', referrer: 'https://wa.me/', search: '?utm_source=whatsapp' }))
    expect(res.status).toBe(204)
    expect(inserted).toEqual([
      {
        path: '/pricing',
        referrer_host: 'wa.me',
        utm_source: 'whatsapp',
        utm_medium: null,
        utm_campaign: null,
        country: 'NG',
        device: 'mobile',
      },
    ])
  })

  it('records nothing outside production', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect((await POST(beacon({ path: '/' }))).status).toBe(204)
    expect(inserted).toHaveLength(0)
  })

  it('ignores requests from another site or with no origin', async () => {
    await POST(beacon({ path: '/' }, { origin: 'https://evil.example' }))
    await POST(beacon({ path: '/' }, { origin: '' }))
    expect(inserted).toHaveLength(0)
  })

  it('ignores crawlers and scripts', async () => {
    await POST(beacon({ path: '/' }, { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }))
    await POST(beacon({ path: '/' }, { 'user-agent': 'curl/8.5.0' }))
    expect(inserted).toHaveLength(0)
  })

  it('ignores malformed and oversized bodies', async () => {
    await POST(beacon('not json'))
    await POST(beacon({ path: `/${'x'.repeat(3000)}` }))
    expect(inserted).toHaveLength(0)
  })
})
