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

  // Parallel execution - disable for emulator to avoid conflicts
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: 1,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/playwright-results.xml' }],
  ],

  // Global setup and teardown
  globalSetup: './e2e-tests/fixtures/globalSetup.ts',
  globalTeardown: './e2e-tests/fixtures/globalTeardown.ts',

  // Timeout settings - increase for emulator
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },

  // Use Vite as dev server with Firebase Emulator
  use: {
    baseURL: 'http://localhost:5173/buymilk/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Set environment variables for Firebase Emulator
    env: {
      VITE_FIREBASE_EMULATOR: 'true',
      VITE_FIREBASE_API_KEY: 'test-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'localhost:9099',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket',
      VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender',
      VITE_FIREBASE_APP_ID: 'test-app-id',
    },
  },

  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Disable service workers for emulator
        launchOptions: {
          args: ['--disable-service-worker'],
        },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          args: ['-disable-service-worker'],
        },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        launchOptions: {
          args: ['--disable-service-workers'],
        },
      },
    },
  ],

  // Web server (Vite) - start with Firebase Emulator
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/buymilk/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Wait for both Vite and Firebase Emulator to start
    waitFor: (server) => {
      return new Promise((resolve) => {
        const checkServers = async () => {
          try {
            // Check if Vite is running
            const viteResponse = await fetch('http://localhost:5173/buymilk/');
            if (!viteResponse.ok) throw new Error('Vite not ready');
            
            // Check if Firebase Emulator is running
            const emulatorResponse = await fetch('http://localhost:8080');
            if (!emulatorResponse.ok) throw new Error('Emulator not ready');
            
            resolve(true);
          } catch (error) {
            setTimeout(checkServers, 1000);
          }
        };
        checkServers();
      });
    },
  },
});
