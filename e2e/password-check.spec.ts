import { createHash } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'

// Runs in both projects: 375px mobile and 1280px desktop.
// The breach service and Supabase sign up are both stubbed: no network, no
// account is created.

const sha1 = (text: string) => createHash('sha1').update(text).digest('hex').toUpperCase()

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
const PASSWORD = 'quiet-harbour-lamp-47'

async function stubSignUp(page: Page) {
  const signUps: string[] = []
  await page.route('**/auth/v1/signup**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS })
      return
    }
    signUps.push(route.request().url())
    await route.fulfill({
      status: 200,
      headers: CORS,
      contentType: 'application/json',
      body: JSON.stringify({ id: '00000000-0000-4000-8000-000000000001', email: 'seller@example.com', identities: [{}] }),
    })
  })
  return signUps
}

async function fillRegister(page: Page, password: string) {
  await page.goto('/register')
  await page.locator('#fullName').fill('Test Seller')
  await page.locator('#email').fill('seller@example.com')
  await page.locator('#phone').fill('08012345678')
  await page.locator('#password').fill(password)
}

test('sign up asks for 10 characters and says how the password is checked', async ({ page }) => {
  await page.goto('/register')
  await expect(page.locator('#password')).toHaveAttribute('minlength', '10')
  await expect(page.locator('#password-hint')).toContainText('At least 10 characters')
  await expect(page.locator('#password-hint')).toContainText('never sees the password')
})

test('a breached password is refused and no account is created', async ({ page }) => {
  const signUps = await stubSignUp(page)
  const requested: string[] = []
  await page.route('**/api/password-check**', async (route) => {
    const url = new URL(route.request().url())
    requested.push(url.search)
    // The breach service reports this exact password, plus padding rows.
    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: `00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2\r\n${sha1(PASSWORD).slice(5)}:12345\r\n011053FD0102E94D6AE2F8B83D76FAF94F6:0`,
    })
  })

  await fillRegister(page, PASSWORD)
  await page.getByRole('button', { name: /create account/i }).click()

  await expect(page.getByText('appeared in a known data breach')).toBeVisible()
  expect(signUps).toHaveLength(0)
  // Only the 5 character prefix left the browser.
  expect(requested).toEqual([`?prefix=${sha1(PASSWORD).slice(0, 5)}`])
})

test('a password that is not breached signs up, and padding rows are not breaches', async ({ page }) => {
  const signUps = await stubSignUp(page)
  await page.route('**/api/password-check**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      // Its own suffix appears only as a padding row with a count of 0.
      body: `00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2\r\n${sha1(PASSWORD).slice(5)}:0`,
    })
  )

  await fillRegister(page, PASSWORD)
  await page.getByRole('button', { name: /create account/i }).click()

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  expect(signUps).toHaveLength(1)
})

test('if the breach check is down, sign up still works', async ({ page }) => {
  const signUps = await stubSignUp(page)
  await page.route('**/api/password-check**', (route) => route.fulfill({ status: 503, body: 'unavailable' }))

  await fillRegister(page, PASSWORD)
  await page.getByRole('button', { name: /create account/i }).click()

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  expect(signUps).toHaveLength(1)
})
