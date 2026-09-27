import crypto from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// In-memory stand-in for the two tables the webhook writes. Only the query
// shapes the route actually uses are supported.
type Row = Record<string, unknown>
const db: { subscriptions: Row[]; profiles: Row[] } = { subscriptions: [], profiles: [] }

function table(name: keyof typeof db) {
  const filters: [string, unknown][] = []
  let pendingUpdate: Row | null = null
  const matches = () => db[name].filter((r) => filters.every(([k, v]) => r[k] === v))
  const builder = {
    select: () => builder,
    eq: (k: string, v: unknown) => {
      filters.push([k, v])
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
    then: (resolve: (v: { error: null }) => void) => {
      if (pendingUpdate) for (const r of matches()) Object.assign(r, pendingUpdate)
      resolve({ error: null })
    },
  }
  return builder
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: (name: keyof typeof db) => table(name) }),
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
})
