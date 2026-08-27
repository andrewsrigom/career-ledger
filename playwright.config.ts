import { defineConfig, devices } from '@playwright/test';

const previewMode = process.env.CAREER_BROWSER_PREVIEW === '1';
const basePath = (process.env.CAREER_BROWSER_BASE_PATH ?? '').replace(/\/+$/, '');
const baseURL = `http://127.0.0.1:4399${basePath}/`;

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: `node --experimental-strip-types scripts/dev-server.ts ${previewMode ? '--preview ' : ''}--port=4399`,
    url: baseURL,
    env: { BASE_PATH: basePath, SITE_URL: 'http://127.0.0.1:4399', ASTRO_TELEMETRY_DISABLED: '1' },
    reuseExistingServer: false,
    timeout: 120_000
  }
});
