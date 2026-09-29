import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { ...devices['iPhone 14'], browserName: 'chromium', locale: 'ja-JP', baseURL: 'http://localhost:4174' },
  webServer: {
    command: 'vite --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: true,
  },
});
