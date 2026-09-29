import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const get = (query: string) => GET(new NextRequest(`https://plotmarket.ng/api/password-check${query}`))

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('GET /api/password-check', () => {
  it('relays the range for a valid prefix, with padding requested, and caches it', async () => {
    fetchMock.mockResolvedValue(new Response('1E4C9B93F3F0682250B6CF8331B7EE68FD8:99\r\n'))
    const res = await get('?prefix=5baa6')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('1E4C9B93F3F0682250B6CF8331B7EE68FD8:99')
    expect(res.headers.get('cache-control')).toContain('s-maxage')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.pwnedpasswords.com/range/5BAA6')
    expect((init.headers as Record<string, string>)['Add-Padding']).toBe('true')
  })

  it.each(['', '?prefix=', '?prefix=5BAA', '?prefix=5BAA61', '?prefix=ZZZZZ', '?prefix=5BAA6/../x', '?prefix=password'])(
    'refuses anything that is not exactly 5 hex characters: %s',
    async (query) => {
      const res = await get(query)
      expect(res.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    }
  )

  it('answers 503 when the upstream service errors or is unreachable', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }))
    expect((await get('?prefix=5BAA6')).status).toBe(503)
    fetchMock.mockRejectedValueOnce(new TypeError('network'))
    expect((await get('?prefix=5BAA6')).status).toBe(503)
  })
})
