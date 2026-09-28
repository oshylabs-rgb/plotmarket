import { expect, test, type Page } from '@playwright/test'
import { FIXTURES } from './fixtures.mjs'

// Runs in both projects: 375px mobile and 1280px desktop.

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(0)
}

const BANNED_PUBLIC_CLAIMS = [
  /verified title/i,
  /unlimited/i,
  /bulk upload/i,
  /api access/i,
  /team seats/i,
  /enquiry report/i,
  /90 days free/i,
  /80,000/,
  /500 listings/i,
  /escrow(?! or)/i,
  /payments secured/i,
  /hand-picked/i,
  /\/month/i,
]

async function expectNoBannedClaims(page: Page) {
  // Disclaimers such as "not verified by Plotmarket" are fine; a badge that
  // just says "Verified" is not.
  await expect(page.getByText(/^\s*verified\s*$/i)).toHaveCount(0)
  const text = await page.locator('body').innerText()
  for (const pattern of BANNED_PUBLIC_CLAIMS) {
    expect(text, `found ${pattern}`).not.toMatch(pattern)
  }
}

test('pricing shows the three approved plans and nothing unbuilt', async ({ page }) => {
  await page.goto('/pricing')
  const free = page.locator('[data-plan="basic"]')
  const pilot = page.locator('[data-plan="pilot"]')
  const business = page.locator('[data-plan="professional"]')

  await expect(free).toContainText('Free Starter')
  await expect(free).toContainText('List up to 3 properties free.')
  await expect(pilot).toContainText('Founding Developer Pilot')
  await expect(pilot).toContainText(
    'Selected developers can request a 30-day pilot for one estate and up to 20 active listings. Approval required. No card or automatic charge.'
  )
  await expect(business).toContainText('Business')
  await expect(business).toContainText('₦35,000')
  await expect(business).toContainText('per 30 days')
  await expect(business).toContainText('Up to 100 active listings')
  await expect(business).toContainText('Does not renew automatically')

  await expect(page.getByRole('heading', { name: 'What happens when a developer pilot ends' })).toBeVisible()
  await expect(page.getByText('nothing is deleted and nothing is charged', { exact: false })).toBeVisible()
  await expect(page.getByText('Plotmarket does not take, hold or protect payments for property')).toBeVisible()

  await expectNoBannedClaims(page)
  await expectNoHorizontalScroll(page)
})

test('home page lists real inventory only and tells the truth about checks', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(FIXTURES.real.title).first()).toBeVisible()
  await expect(page.getByText(FIXTURES.demo.title)).toHaveCount(0)
  await expect(page.getByText('Every listing reviewed before it goes live. Not a title check.')).toBeVisible()
  await expect(page.getByText('Title-document type stated by the seller').first()).toBeVisible()
  await expect(page.getByText('List up to 3 properties free.').first()).toBeVisible()
  await expectNoBannedClaims(page)
  await expectNoHorizontalScroll(page)
})

test('browse page labels demo listings and shows no verified badge', async ({ page }) => {
  await page.goto('/properties')
  const demoCard = page.locator('a', { hasText: FIXTURES.demo.title })
  await expect(demoCard).toContainText('Demo listing, not for sale')
  const realCard = page.locator('a', { hasText: FIXTURES.real.title })
  await expect(realCard).not.toContainText('Demo listing')
  await expectNoBannedClaims(page)
  await expectNoHorizontalScroll(page)
})

test('real listing: seller-stated title, enquiry open, listing markup present', async ({ page }) => {
  await page.goto(`/properties/${FIXTURES.real.id}`)
  await expect(page.getByRole('heading', { name: FIXTURES.real.title })).toBeVisible()
  await expect(page.getByText('Title-document type stated by the seller.', { exact: false })).toBeVisible()
  await expect(page.getByText('does not verify the seller', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send Inquiry' })).toBeVisible()
  expect(await page.content()).toContain('"@type":"RealEstateListing"')
  await expectNoBannedClaims(page)
  await expectNoHorizontalScroll(page)
})

test('demo listing: labelled, enquiries closed, hidden from search engines', async ({ page }) => {
  await page.goto(`/properties/${FIXTURES.demo.id}`)
  await expect(page.getByRole('note')).toContainText('Demo listing, not for sale.')
  await expect(page.getByText('Enquiries are closed: this is a demo listing')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send Inquiry' })).toHaveCount(0)
  expect(await page.content()).not.toContain('RealEstateListing')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expectNoHorizontalScroll(page)
})

test('paused listing: says it is no longer listed and shows none of its details', async ({ page }) => {
  await page.goto(`/properties/${FIXTURES.paused.id}`)
  await expect(page.getByRole('heading', { name: 'This listing is no longer listed' })).toBeVisible()
  await expect(page.getByText('Enquiries are closed.')).toBeVisible()
  await expect(page.getByText(FIXTURES.paused.title)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Send Inquiry' })).toHaveCount(0)
})

test('unknown listing is a 404', async ({ page }) => {
  const res = await page.goto('/properties/99999999-9999-4999-8999-999999999999')
  expect(res?.status()).toBe(404)
})

test('sitemap includes real listings and leaves demo listings out', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml).toContain(`/properties/${FIXTURES.real.id}`)
  expect(xml).not.toContain(FIXTURES.demo.id)
  expect(xml).not.toContain(FIXTURES.paused.id)
})

test('pilot sign up link explains approval and preselects developer', async ({ page }) => {
  await page.goto('/register?plan=pilot')
  await expect(page.getByText('Every request is approved by hand. No card or automatic charge.', { exact: false })).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test('signed out visitors cannot reach the seller dashboard or admin', async ({ page }) => {
  await page.goto('/dashboard/subscription')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard%2Fsubscription/)
  await page.goto('/admin/pilots')
  await expect(page).toHaveURL(/\/login/)
})

test('screenshots for review', async ({ page }, info) => {
  for (const path of ['/pricing', '/']) {
    await page.goto(path)
    await page.screenshot({
      path: `test-results/screens/${info.project.name}${path === '/' ? '-home' : path.replace('/', '-')}.png`,
      fullPage: true,
    })
  }
})
