import { defineConfig, devices } from '@playwright/test';

// An isolated port lets the PWA replacement-build proof run without relying on
// the lifetime of a preceding preview process.
const e2ePort = Number(process.env.WM_E2E_PORT ?? '4174');
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: e2eBaseUrl,
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${e2ePort}`,
    url: e2eBaseUrl,
    // PWA tests require the build produced for this run; a reused preview may hold a stale service worker.
    reuseExistingServer: false,
  },
});
