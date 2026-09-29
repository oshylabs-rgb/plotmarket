import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BUSINESS_PLAN, LISTING_LIMITS, PILOT_DAYS } from './plans'

// The pilot brochure (public/brochures/plotmarket-developer-pilot.pdf) is built
// from brochure/developer-pilot.html. It goes out with every developer email,
// so it must never drift from the plans. Change the plans, rebuild with
// `npm run brochure`, and this passes again.

const html = readFileSync(resolve(__dirname, '../../brochure/developer-pilot.html'), 'utf8')

const visibleText = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<svg[\s\S]*?<\/svg>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')

describe('pilot brochure', () => {
  it('states the current pilot terms', () => {
    expect(visibleText).toContain(`Up to ${LISTING_LIMITS.pilot} active listings`)
    expect(visibleText).toContain(`List one estate free for ${PILOT_DAYS} days`)
    expect(visibleText).toContain(`The ${PILOT_DAYS} days start when we approve`)
    expect(visibleText).toContain(`Your ${LISTING_LIMITS.basic} earliest published listings stay live`)
    expect(visibleText).toContain(`Or choose which ${LISTING_LIMITS.basic} stay live`)
  })

  it('states the current Business plan', () => {
    const price = BUSINESS_PLAN.price.toLocaleString('en-NG')
    expect(visibleText).toContain(`₦${price} for ${BUSINESS_PLAN.periodDays} days`)
    expect(visibleText).toContain(`up to ${BUSINESS_PLAN.listings} active listings`)
    expect(visibleText).toContain('It does not renew automatically')
  })

  it('makes no claim the site cannot back up', () => {
    for (const banned of [/90.day/i, /500 listings/i, /80,000/, /verified/i, /escrow/i, /guarantee/i, /unlimited/i, /commission/i, /\/month/i]) {
      expect(visibleText, `found ${banned}`).not.toMatch(banned)
    }
    expect(visibleText).toContain('does not verify title documents or identity')
    expect(visibleText).toContain('never takes or holds payment for a property')
  })

  it('carries the right contact details', () => {
    // The number in the brochure and in every email is Mr Desmond Oshenye's.
    expect(visibleText).toContain('Mr Desmond Oshenye')
    expect(html).toContain('tel:+2348032179317')
    expect(html).toContain('mailto:arnold.oshenye@oshylabs.eu')
    expect(html).toContain('https://plotmarket.ng/register?plan=pilot')
  })

  it('has no hyphens or dashes in the visible text', () => {
    expect(visibleText).not.toMatch(/[-–—]/)
  })
})
