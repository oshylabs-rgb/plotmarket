import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = {
  rpcCalls: [] as string[],
  due: [] as Record<string, unknown>[],
  marked: [] as string[],
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (fn: string) => {
      state.rpcCalls.push(fn)
      return { data: [{ user_id: 'u1', reason: 'pilot_ended', paused: 17 }], error: null }
    },
    from: () => {
      let updating = false
      const builder = {
        select: () => builder,
        eq: (_k: string, v: string) => {
          if (updating) {
            state.marked.push(v)
            return Promise.resolve({ error: null })
          }
          return builder
        },
        is: () => builder,
        gt: () => builder,
        lte: async () => ({ data: state.due, error: null }),
        update: () => {
          updating = true
          return builder
        },
      }
      return builder
    },
  }),
}))

const fetchMock = vi.fn()

const { GET } = await import('./route')

function request(auth?: string) {
  return new NextRequest('http://localhost/api/cron/plan-expiry', {
    headers: auth ? { authorization: auth } : {},
  })
}

beforeEach(() => {
  state.rpcCalls = []
  state.marked = []
  state.due = [
    {
      id: 'pilot-1',
      project_name: 'Crestline Court',
      ends_at: '2026-10-05T09:00:00Z',
      profile: { email: 'dev@example.com', full_name: 'Ada' },
    },
  ]
  process.env.CRON_SECRET = 'cron-test-secret'
  process.env.RESEND_API_KEY = 're_test_not_real'
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock) // no live email leaves the test
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('plan expiry cron', () => {
  it('refuses a caller without the cron secret', async () => {
    expect((await GET(request())).status).toBe(401)
    expect((await GET(request('Bearer wrong'))).status).toBe(401)
    expect(state.rpcCalls).toHaveLength(0)
  })

  it('refuses to run at all when no secret is configured', async () => {
    delete process.env.CRON_SECRET
    expect((await GET(request('Bearer '))).status).toBe(503)
  })

  it('runs the expiry job and sends each due pilot one plain reminder', async () => {
    const res = await GET(request('Bearer cron-test-secret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ expired: 1, warned: 1 })
    expect(state.rpcCalls).toEqual(['run_plan_expiry'])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(init.body)
    expect(body.to).toEqual(['dev@example.com'])
    expect(body.subject).toContain('Your Plotmarket pilot ends on')
    expect(body.text).toContain('nothing is deleted and nothing is charged')
    expect(body.text).toContain('does not renew automatically')
    expect(body.text).not.toMatch(/guarantee|escrow|verified/i)
    expect(state.marked).toEqual(['pilot-1'])
  })

  it('does not mark a reminder sent when the email fails, so it retries tomorrow', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }))
    const res = await GET(request('Bearer cron-test-secret'))
    expect(await res.json()).toEqual({ expired: 1, warned: 0 })
    expect(state.marked).toEqual([])
  })
})
