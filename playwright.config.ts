/**
 * Playwright Configuration for E2E Testing
 * NO webServer config - manual startup for safety
 */

import { defineConfig, devices } from '@playwright/test'

// See https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Test file patterns
  testMatch: /.*\.(e2e|spec)\.ts$/,

  // Global timeout for the whole test run
  globalTimeout: 30 * 60 * 1000, // 30 minutes

  // Timeout for each test
  timeout: 30 * 1000, // 30 seconds

  // Timeout for each assertion
  expect: {
    timeout: 5000
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Workers - use 1 for stability
  workers: 1,

  // Reporter to use
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Emulate viewport
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Locale
    locale: 'en-US',

    // Timezone
    timezoneId: 'America/New_York',

    // Permissions
    permissions: [],

    // Geolocation
    geolocation: undefined,

    // Color scheme
    colorScheme: 'light',

    // User agent
    userAgent: undefined
  },

  // Configure projects: default minimal (Chromium only). Set PW_ALL=1 to run across all browsers/devices
  projects:
    process.env.PW_ALL === '1'
      ? [
          { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          // Mobile viewports
          { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
          { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
          // Branded browsers
          {
            name: 'Microsoft Edge',
            use: { ...devices['Desktop Edge'], channel: 'msedge' }
          },
          {
            name: 'Google Chrome',
            use: { ...devices['Desktop Chrome'], channel: 'chrome' }
          }
        ]
      : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Output folder for test artifacts
  outputDir: 'test-results',

  // IMPORTANT: NO webServer configuration!
  // Manual server startup for safety
  // Start servers separately in different terminals:
  // Terminal 1: npm run dev
  // Terminal 2: npm run test:e2e
  //
  // webServer: undefined, // Explicitly no web server

  // Global setup
  // globalSetup: undefined,

  // Global teardown
  // globalTeardown: undefined

  // Store artifacts
  preserveOutput: 'failures-only',

  // Update snapshots
  updateSnapshots: 'missing',

  // Snapshot path template
  snapshotPathTemplate:
    '{testDir}/__snapshots__/{testFilePath}/{testName}-{projectName}-{platform}{ext}'
})
