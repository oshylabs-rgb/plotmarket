import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// In-memory pilots table supporting the query shapes the route uses.
type Pilot = {
  id: string
  status: string
  project_name: string
  ends_at: string
  expiry_warning_sent_at: string | null
  profile: { email: string; full_name: string | null } | null
}
const state = { rpcCalls: [] as string[], pilots: [] as Pilot[] }

function pilotsTable() {
  const filters: ((p: Pilot) => boolean)[] = []
  let patch: Partial<Pilot> | null = null
  const rows = () => state.pilots.filter((p) => filters.every((f) => f(p)))
  const run = () => {
    const matched = rows()
    if (patch) for (const p of matched) Object.assign(p, patch)
    return { data: matched.map((p) => ({ ...p })), error: null }
  }
  const builder = {
    select: () => (patch ? Promise.resolve(run()) : builder),
    update: (next: Partial<Pilot>) => {
      patch = next
      return builder
    },
    eq: (k: keyof Pilot, v: unknown) => {
      filters.push((p) => p[k] === v)
      return builder
    },
    is: (k: keyof Pilot, v: null) => {
      filters.push((p) => p[k] === v)
      return builder
    },
    gt: (k: keyof Pilot, v: string) => {
      filters.push((p) => String(p[k]) > v)
      return builder
    },
    lte: (k: keyof Pilot, v: string) => {
      filters.push((p) => String(p[k]) <= v)
      return Promise.resolve(run())
    },
    then: (resolve: (v: unknown) => void) => resolve(run()),
  }
  return builder
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (fn: string) => {
      state.rpcCalls.push(fn)
      return { data: [{ user_id: 'u1', reason: 'pilot_ended', paused: 17 }], error: null }
    },
    from: () => pilotsTable(),
  }),
}))

const fetchMock = vi.fn()
const { GET } = await import('./route')

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString()
const request = (auth?: string) =>
  new NextRequest('http://localhost/api/cron/plan-expiry', { headers: auth ? { authorization: auth } : {} })

beforeEach(() => {
  state.rpcCalls = []
  state.pilots = [
    {
      id: 'due',
      status: 'active',
      project_name: 'Crestline Court',
      ends_at: inDays(5),
      expiry_warning_sent_at: null,
      profile: { email: 'dev@example.com', full_name: 'Ada' },
    },
    {
      id: 'later',
      status: 'active',
      project_name: 'Far Estate',
      ends_at: inDays(20),
      expiry_warning_sent_at: null,
      profile: { email: 'later@example.com', full_name: null },
    },
  ]
  delete process.env.CRON_SECRET
  process.env.RESEND_API_KEY = 're_test_not_real'
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock) // no live email leaves the test
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('plan expiry cron', () => {
  it('when a secret is configured, refuses callers without it', async () => {
    process.env.CRON_SECRET = 'cron-test-secret'
    expect((await GET(request())).status).toBe(401)
    expect((await GET(request('Bearer wrong'))).status).toBe(401)
    expect(state.rpcCalls).toHaveLength(0)
    expect((await GET(request('Bearer cron-test-secret'))).status).toBe(200)
  })

  it('without a secret it still runs, because it only does what is already due', async () => {
    const res = await GET(request())
    expect(res.status).toBe(200)
    expect(state.rpcCalls).toEqual(['run_plan_expiry'])
  })

  it('sends one plain reminder to the pilot ending within 7 days, and none to the later one', async () => {
    const res = await GET(request())
    expect(await res.json()).toEqual({ expired: 1, warned: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(init.body)
    expect(body.to).toEqual(['dev@example.com'])
    expect(body.subject).toContain('Your Plotmarket pilot ends on')
    expect(body.text).toContain('nothing is deleted and nothing is charged')
    expect(body.text).toContain('does not renew automatically')
    expect(body.text).not.toMatch(/guarantee|escrow|verified/i)
    expect(state.pilots.find((p) => p.id === 'due')!.expiry_warning_sent_at).not.toBeNull()
    expect(state.pilots.find((p) => p.id === 'later')!.expiry_warning_sent_at).toBeNull()
  })

  it('never sends the same reminder twice, even when runs overlap', async () => {
    await Promise.all([GET(request()), GET(request())])
    await GET(request())
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('releases the claim when the email fails, so the next run retries', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }))
    const first = await GET(request())
    expect(await first.json()).toEqual({ expired: 1, warned: 0 })
    expect(state.pilots.find((p) => p.id === 'due')!.expiry_warning_sent_at).toBeNull()
    const second = await GET(request())
    expect(await second.json()).toEqual({ expired: 1, warned: 1 })
  })
})
