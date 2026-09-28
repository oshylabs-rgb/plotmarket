import { describe, expect, it } from 'vitest'
import { toVisitRow, type VisitContext } from './visits'

const ctx: VisitContext = { siteHost: 'plotmarket.ng', country: 'NG', deviceType: 'mobile', isBot: false }

describe('toVisitRow', () => {
  it('keeps path, external referrer host, campaign tags, country and device only', () => {
    expect(
      toVisitRow(
        {
          path: '/pricing',
          referrer: 'https://www.google.com/search?q=land+lekki',
          search: '?utm_source=whatsapp&utm_medium=dm&utm_campaign=pilot-oct&fbclid=abc',
        },
        ctx
      )
    ).toEqual({
      path: '/pricing',
      referrer_host: 'google.com',
      utm_source: 'whatsapp',
      utm_medium: 'dm',
      utm_campaign: 'pilot-oct',
      country: 'NG',
      device: 'mobile',
    })
  })

  it('drops the query string and hash from the path', () => {
    expect(toVisitRow({ path: '/properties?q=lekki#top' }, ctx)?.path).toBe('/properties')
  })

  it('treats the site itself as no referrer, with or without www', () => {
    expect(toVisitRow({ path: '/', referrer: 'https://www.plotmarket.ng/pricing' }, ctx)?.referrer_host).toBeNull()
  })

  it('ignores bots, the admin area, API paths and anything that is not a site path', () => {
    expect(toVisitRow({ path: '/' }, { ...ctx, isBot: true })).toBeNull()
    expect(toVisitRow({ path: '/admin/users' }, ctx)).toBeNull()
    expect(toVisitRow({ path: '/api/visit' }, ctx)).toBeNull()
    expect(toVisitRow({ path: 'https://evil.example/' }, ctx)).toBeNull()
    expect(toVisitRow({ path: '//evil.example/' }, ctx)).toBeNull()
    expect(toVisitRow({ path: 42 }, ctx)).toBeNull()
    expect(toVisitRow(null, ctx)).toBeNull()
  })

  it('still counts paths that merely start with the same letters', () => {
    expect(toVisitRow({ path: '/apiary' }, ctx)?.path).toBe('/apiary')
  })

  it('maps device types and rejects bad country codes', () => {
    expect(toVisitRow({ path: '/' }, { ...ctx, deviceType: undefined })?.device).toBe('desktop')
    expect(toVisitRow({ path: '/' }, { ...ctx, deviceType: 'tablet' })?.device).toBe('tablet')
    expect(toVisitRow({ path: '/' }, { ...ctx, deviceType: 'smarttv' })?.device).toBeNull()
    expect(toVisitRow({ path: '/' }, { ...ctx, country: 'Nigeria' })?.country).toBeNull()
  })

  it('clips long values to the column limits', () => {
    const row = toVisitRow({ path: `/${'a'.repeat(400)}`, search: `?utm_campaign=${'c'.repeat(150)}` }, ctx)
    expect(row?.path.length).toBe(300)
    expect(row?.utm_campaign?.length).toBe(100)
  })

  it('ignores a referrer that is not a URL', () => {
    expect(toVisitRow({ path: '/', referrer: 'not a url' }, ctx)?.referrer_host).toBeNull()
  })
})
