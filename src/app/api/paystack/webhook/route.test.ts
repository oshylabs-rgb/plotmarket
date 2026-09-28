import crypto from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// In-memory stand-in for the two tables the webhook writes. Only the query
// shapes the route actually uses are supported.
type Row = Record<string, unknown>
const db: { subscriptions: Row[]; profiles: Row[] } = { subscriptions: [], profiles: [] }

const rpcCalls: { fn: string; args: unknown }[] = []
let failProfileUpdateOnce = false

function table(name: keyof typeof db) {
  const filters: ((r: Row) => boolean)[] = []
  let pendingUpdate: Row | null = null
  let sortKey: string | null = null
  const matches = () => {
    const rows = db[name].filter((r) => filters.every((f) => f(r)))
    if (sortKey) rows.sort((a, b) => String(b[sortKey!]).localeCompare(String(a[sortKey!])))
    return rows
  }
  const builder = {
    select: () => builder,
    eq: (k: string, v: unknown) => {
      filters.push((r) => r[k] === v)
      return builder
    },
    gt: (k: string, v: string) => {
      filters.push((r) => String(r[k]) > v)
      return builder
    },
    order: (k: string) => {
      sortKey = k
      return builder
    },
    limit: async () => ({ data: matches(), error: null }),
    insert: async (row: Row) => {
      const ref = row.paystack_reference
      if (ref && db[name].some((r) => r.paystack_reference === ref)) {
        return { error: { code: '23505', message: 'duplicate key' } }
      }
      db[name].push({ ...row })
      return { error: null }
    },
    update: (patch: Row) => {
      pendingUpdate = patch
      return builder
    },
    then: (resolve: (v: { error: unknown }) => void) => {
      if (name === 'profiles' && pendingUpdate && failProfileUpdateOnce) {
        failProfileUpdateOnce = false
        return resolve({ error: { message: 'temporary failure' } })
      }
      if (pendingUpdate) for (const r of matches()) Object.assign(r, pendingUpdate)
      resolve({ error: null })
    },
  }
  return builder
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (name: keyof typeof db) => table(name),
    rpc: async (fn: string, args: unknown) => {
      rpcCalls.push({ fn, args })
      return { error: null }
    },
  }),
}))

const SECRET = 'sk_test_webhook'
process.env.PAYSTACK_SECRET_KEY = SECRET

const { POST } = await import('./route')

function signedRequest(payload: unknown, secret = SECRET) {
  const body = JSON.stringify(payload)
  const signature = crypto.createHmac('sha512', secret).update(body).digest('hex')
  return new NextRequest('http://localhost/api/paystack/webhook', {
    method: 'POST',
    body,
    headers: { 'x-paystack-signature': signature },
  })
}

function charge(overrides: Record<string, unknown> = {}) {
  return {
    event: 'charge.success',
    data: {
      reference: 'ref_1',
      amount: 35000 * 100,
      currency: 'NGN',
      customer: { customer_code: 'CUS_1' },
      metadata: { user_id: 'user-1', plan_id: 'professional' },
      ...overrides,
    },
  }
}

beforeEach(() => {
  rpcCalls.length = 0
  failProfileUpdateOnce = false
  db.subscriptions = []
  db.profiles = [{ id: 'user-1', account_type: 'basic' }]
})

describe('Paystack webhook charge.success', () => {
  it('rejects a bad signature and grants nothing', async () => {
    const res = await POST(signedRequest(charge(), 'wrong_secret'))
    expect(res.status).toBe(401)
    expect(db.subscriptions).toHaveLength(0)
    expect(db.profiles[0].account_type).toBe('basic')
  })

  it('grants the plan when the full price was paid in naira', async () => {
    const res = await POST(signedRequest(charge()))
    expect(res.status).toBe(200)
    expect(db.subscriptions).toHaveLength(1)
    expect(db.subscriptions[0]).toMatchObject({ plan: 'professional', amount: 35000, status: 'active' })
    expect(db.profiles[0].account_type).toBe('professional')
  })

  it('does not grant a plan for an underpaid charge', async () => {
    const res = await POST(signedRequest(charge({ amount: 100 * 100 })))
    expect(res.status).toBe(200) // acknowledged, so Paystack stops retrying
    expect(db.subscriptions).toHaveLength(0)
    expect(db.profiles[0].account_type).toBe('basic')
  })

  it('does not grant a plan for a charge in another currency', async () => {
    await POST(signedRequest(charge({ currency: 'USD' })))
    expect(db.subscriptions).toHaveLength(0)
    expect(db.profiles[0].account_type).toBe('basic')
  })

  it('does not grant plans that cannot be bought online', async () => {
    for (const plan_id of ['enterprise', 'free', 'business', 'starter']) {
      await POST(signedRequest(charge({ metadata: { user_id: 'user-1', plan_id } })))
    }
    expect(db.subscriptions).toHaveLength(0)
    expect(db.profiles[0].account_type).toBe('basic')
  })

  it('is idempotent across Paystack retries', async () => {
    await POST(signedRequest(charge()))
    const retry = await POST(signedRequest(charge()))
    expect(retry.status).toBe(200)
    expect(db.subscriptions).toHaveLength(1)
  })

  it('rebalances the seller listings after granting, so paused listings come back', async () => {
    await POST(signedRequest(charge()))
    expect(rpcCalls).toEqual([{ fn: 'apply_allowance', args: { p_user: 'user-1' } }])
  })

  it('finishes the grant on retry when a later step failed the first time', async () => {
    failProfileUpdateOnce = true
    const first = await POST(signedRequest(charge()))
    expect(first.status).toBe(500) // Paystack will retry
    expect(db.subscriptions).toHaveLength(1)
    expect(db.profiles[0].account_type).toBe('basic')

    const retry = await POST(signedRequest(charge()))
    expect(retry.status).toBe(200)
    expect(db.subscriptions).toHaveLength(1)
    expect(db.profiles[0].account_type).toBe('professional')
    expect(rpcCalls).toHaveLength(1)
  })

  it('paying while a period is running extends from its end instead of overlapping', async () => {
    const runningEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    db.subscriptions.push({
      user_id: 'user-1',
      plan: 'professional',
      status: 'active',
      end_date: runningEnd,
      paystack_reference: 'ref_0',
    })
    await POST(signedRequest(charge()))
    const added = db.subscriptions.find((s) => s.paystack_reference === 'ref_1')!
    expect(added.start_date).toBe(runningEnd)
    const days = (Date.parse(added.end_date as string) - Date.parse(runningEnd)) / 86400000
    expect(days).toBe(30)
  })
})
