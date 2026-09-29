import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { ...devices['iPhone 14'], browserName: 'chromium', locale: 'ja-JP', baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'vite --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
