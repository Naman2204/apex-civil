import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for ApexCivil
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: '.freebuff/playwright-report' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video on failure */
    video: 'retain-on-failure',
    /* Viewport size */
    viewport: { width: 1440, height: 900 },
  },

  /* Global setup — fetches the Clerk Testing Token before any tests run */
  globalSetup: './e2e/global.setup.ts',

  /* Configure projects for major browsers */
  projects: [
    /* ── Global setup must run first ── */
    {
      name: 'clerk-setup',
      testMatch: /global\.setup\.ts$/,
    },

    /* ── Unauthenticated tests (smoke, security, a11y, etc.) ── */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /(?:authenticated|strict-exam).*\.spec\.ts$/,
    },

    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: /(?:authenticated|strict-exam).*\.spec\.ts$/,
    },

    /* ── Authenticated dashboard tests (depend on Clerk token) ── */
    {
      name: 'authenticated',
      testMatch: /(?:authenticated|strict-exam).*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        /* Extra timeout for auth + server action calls */
        actionTimeout: 15_000,
      },
      dependencies: ['clerk-setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
