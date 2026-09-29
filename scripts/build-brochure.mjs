// Builds public/brochures/plotmarket-developer-pilot.pdf from
// brochure/developer-pilot.html, using the site's own fonts.
//
//   npm run brochure
//
// Uses the Chromium that Playwright already provides for the e2e tests.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'brochure/developer-pilot.html')
const output = resolve(root, 'public/brochures/plotmarket-developer-pilot.pdf')

mkdirSync(dirname(output), { recursive: true })

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.goto(pathToFileURL(source).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.pdf({ path: output, format: 'A4', printBackground: true, preferCSSPageSize: true })
  console.log(`Wrote ${output}`)
} finally {
  await browser.close()
}
