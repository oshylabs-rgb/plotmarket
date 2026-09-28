import { beforeEach, describe, expect, it, vi } from 'vitest'

type Err = { code: string; message: string } | null
const errors: { paused: Err; demo: Err; rpc: Err } = { paused: null, demo: null, rpc: null }

vi.mock('@/lib/supabase/public', () => ({
  createPublicClient: () => ({
    from: () => ({
      select: (cols: string) => {
        if (cols === 'is_demo') return { limit: async () => ({ data: [], error: errors.demo }) }
        return { eq: async () => ({ count: 0, error: errors.paused }) }
      },
    }),
    rpc: async () => ({ data: null, error: errors.rpc }),
  }),
}))

const { GET } = await import('./route')

beforeEach(() => {
  errors.paused = null
  errors.demo = null
  errors.rpc = null
})

describe('plan migrations health check', () => {
  it('is healthy when every migration is in place', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.healthy).toBe(true)
    expect(Object.values(body.checks)).toEqual(['ok', 'ok', 'ok'])
  })

  it('reports 0006 missing when the database rejects the paused status', async () => {
    errors.paused = { code: '22P02', message: 'invalid input value for enum property_status: "paused"' }
    const res = await GET()
    expect(res.status).toBe(503)
    expect((await res.json()).checks.migration_0006_paused_status).toBe('missing')
  })

  it('reports 0007 missing when its column and function are absent', async () => {
    errors.demo = { code: '42703', message: 'column properties.is_demo does not exist' }
    errors.rpc = { code: 'PGRST202', message: 'Could not find the function' }
    const body = await (await GET()).json()
    expect(body.checks.migration_0007_is_demo_column).toBe('missing')
    expect(body.checks.migration_0007_listing_availability).toBe('missing')
  })

  it('never returns rows or error details', async () => {
    errors.paused = { code: 'XX000', message: 'secret internal detail' }
    const text = await (await GET()).text()
    expect(text).not.toContain('secret internal detail')
  })
})
