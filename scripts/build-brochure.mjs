// Builds the two developer pilot handouts from their HTML sources, using the
// site's own fonts:
//   public/brochures/plotmarket-developer-pilot.pdf            two page A4 brochure
//   public/brochures/plotmarket-developer-pilot-poster-A3.pdf  A3 poster, vector (prints at A3, A2 or A1)
//   public/brochures/plotmarket-developer-pilot-poster.png     the same poster as an image to share by phone
//
//   npm run brochure
//
// Uses the Chromium that Playwright already provides for the e2e tests.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/brochures')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
try {
  // Brochure, A4, two pages.
  {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(resolve(root, 'brochure/developer-pilot.html')).href, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const out = resolve(outDir, 'plotmarket-developer-pilot.pdf')
    await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true })
    console.log(`Wrote ${out}`)
    await page.close()
  }

  // Poster, A3, one page, plus a PNG for sharing on a phone (about 190 dpi).
  {
    const page = await browser.newPage({ viewport: { width: 1123, height: 1587 }, deviceScaleFactor: 2 })
    await page.goto(pathToFileURL(resolve(root, 'brochure/poster.html')).href, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const pdf = resolve(outDir, 'plotmarket-developer-pilot-poster-A3.pdf')
    await page.pdf({ path: pdf, width: '297mm', height: '420mm', printBackground: true, preferCSSPageSize: true })
    console.log(`Wrote ${pdf}`)
    const png = resolve(outDir, 'plotmarket-developer-pilot-poster.png')
    await page.locator('.poster').screenshot({ path: png })
    console.log(`Wrote ${png}`)
    await page.close()
  }
} finally {
  await browser.close()
}
