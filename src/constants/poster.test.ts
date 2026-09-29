import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LISTING_LIMITS, PILOT_DAYS } from './plans'

// The A3 poster (public/brochures/plotmarket-developer-pilot-poster-A3.pdf) is
// built from brochure/poster.html and printed in Nigeria, where it cannot be
// recalled. It must never drift from the plans. Change the plans, rebuild with
// `npm run brochure`, and this passes again.

const html = readFileSync(resolve(__dirname, '../../brochure/poster.html'), 'utf8')

const visibleText = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<svg[\s\S]*?<\/svg>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')

describe('pilot poster', () => {
  it('states the current pilot terms', () => {
    expect(visibleText).toContain(`${LISTING_LIMITS.pilot} active listings`)
    expect(visibleText).toContain(`free for ${PILOT_DAYS} days`)
    expect(visibleText).toContain(`${PILOT_DAYS} days from the day we approve you`)
    expect(visibleText).toContain(`your ${LISTING_LIMITS.basic} earliest listings stay live free`)
    expect(visibleText).toContain('nothing is deleted and nothing is charged')
    expect(visibleText).toContain('One estate per company. Approval required.')
  })

  it('makes no claim the site cannot back up', () => {
    for (const banned of [/90.day/i, /500 listings/i, /80,000/, /verified/i, /escrow/i, /guarantee/i, /unlimited/i, /commission/i, /\/month/i, /₦/]) {
      expect(visibleText, `found ${banned}`).not.toMatch(banned)
    }
    expect(visibleText).toContain('does not verify title documents')
    expect(visibleText).toContain('never takes or holds payment for a property')
  })

  it('sends readers to Mr Desmond Oshenye and the tracked register link', () => {
    expect(visibleText).toContain('Mr Desmond Oshenye')
    expect(visibleText).toContain('+234 803 217 9317')
    // The QR code image itself is checked by decoding the built PDF; this keeps its documented target in step.
    expect(html).toContain('https://plotmarket.ng/register?plan=pilot&utm_source=poster&utm_medium=print&utm_campaign=pilot-oct26')
  })

  it('has no hyphens or dashes in the visible text', () => {
    expect(visibleText).not.toMatch(/[-–—]/)
  })
})
