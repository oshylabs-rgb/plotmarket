import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  BUSINESS_PLAN,
  LISTING_LIMITS,
  PUBLIC_PLANS,
  friendlyListingError,
  getPurchasablePlan,
} from './plans'

const migration = readFileSync(
  fileURLToPath(new URL('../../supabase/migrations/0007_plans_and_pilots.sql', import.meta.url)),
  'utf8'
)

describe('plan definitions', () => {
  it('match the limits the database enforces', () => {
    const fn = migration.slice(migration.indexOf('function public.plan_listing_limit'))
    const body = fn.slice(0, fn.indexOf('$$;'))
    const sql = Object.fromEntries(
      [...body.matchAll(/when '(\w+)'\s+then (\d+)/g)].map((m) => [m[1], Number(m[2])])
    )
    const app = Object.fromEntries(
      Object.entries(LISTING_LIMITS).filter(([, v]) => v !== null)
    )
    expect(sql).toEqual(app)
  })

  it('sell only Business online, at the approved price and allowance', () => {
    expect(getPurchasablePlan('professional')).toEqual(BUSINESS_PLAN)
    expect(BUSINESS_PLAN).toMatchObject({ price: 35000, periodDays: 30, listings: 100 })
    for (const id of ['free', 'basic', 'pilot', 'enterprise', 'business', 'starter']) {
      expect(getPurchasablePlan(id)).toBeUndefined()
    }
  })

  it('show the exact approved public copy', () => {
    const byKey = Object.fromEntries(PUBLIC_PLANS.map((p) => [p.key, p]))
    expect(byKey.basic.summary).toBe('List up to 3 properties free.')
    expect(byKey.pilot.summary).toBe(
      'Selected developers can request a 30-day pilot for one estate and up to 20 active listings. Approval required. No card or automatic charge.'
    )
    expect(byKey.professional.priceLabel).toBe('₦35,000')
  })

  it('never advertise features that do not exist', () => {
    const copy = JSON.stringify(PUBLIC_PLANS).toLowerCase()
    for (const banned of [
      'verified',
      'bulk upload',
      'api access',
      'analytics',
      'report',
      'team seat',
      'priority support',
      'unlimited',
      'escrow',
      'guarantee',
      '/month',
      '90 day',
      '500',
      '80,000',
    ]) {
      expect(copy, banned).not.toContain(banned)
    }
  })

  it('turn database refusals into plain messages', () => {
    expect(
      friendlyListingError('LISTING_LIMIT: your plan allows 3 active listings and you have 3.')
    ).toBe(
      'Your plan allows 3 active listings and you have 3. Pause or mark sold a listing you no longer need, or upgrade on the Plan page.'
    )
    expect(
      friendlyListingError('PILOT_SCOPE: pilot listings must be in the nominated estate, Crestline.')
    ).toBe('Pilot listings must be in the nominated estate, Crestline.')
    expect(friendlyListingError('something else')).toBe('something else')
  })
})
