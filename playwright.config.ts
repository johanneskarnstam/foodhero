import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Test directory
  testDir: './e2e-tests',

  // Parallel execution - enable for faster tests with mocking
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI
  retries: process.env.CI ? 2 : 0,

  // Workers for parallel execution
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/playwright-results.xml' }],
  ],

  // Global setup and teardown
  globalSetup: './e2e-tests/fixtures/globalSetup.ts',
  globalTeardown: './e2e-tests/fixtures/globalTeardown.ts',

  // Timeout settings
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },

  // Use Vite as dev server with Mock Auth
  use: {
    baseURL: 'http://localhost:5173/buymilk/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
    },
  ],

  // Web server (Vite)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/buymilk/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
