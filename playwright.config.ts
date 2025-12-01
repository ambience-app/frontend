import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  expect: { 
    timeout: 5_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 }, // Tolerate 1% difference in visual tests
  },
  fullyParallel: true,
  retries: 1, // Retry failed tests once
  reporter: [
    ['list'],
    ['html', { open: 'never' }], // HTML report
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }], // JUnit report for CI
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  webServer: {
    command: 'NEXT_PUBLIC_E2E=1 next dev -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
