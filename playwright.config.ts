import { defineConfig } from '@playwright/test'

const MOCK_PORT = 54400
const APP_PORT = 3100

/**
 * End-to-end tests against a real production build. Supabase is replaced by
 * e2e/mock-supabase.mjs, so no network, no real project, no Paystack and no
 * email are involved. Run with: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    browserName: 'chromium',
  },
  projects: [
    { name: 'mobile-375', use: { viewport: { width: 375, height: 812 } } },
    { name: 'desktop-1280', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: [
    {
      command: 'node e2e/mock-supabase.mjs',
      port: MOCK_PORT,
      env: { MOCK_SUPABASE_PORT: String(MOCK_PORT) },
      reuseExistingServer: false,
    },
    {
      // Google Fonts downloads can fail transiently in CI sandboxes; one retry.
      command: `(npx next build || npx next build) && npx next start -p ${APP_PORT}`,
      port: APP_PORT,
      timeout: 300_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key-not-real',
        NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${APP_PORT}`,
      },
      reuseExistingServer: false,
    },
  ],
})
