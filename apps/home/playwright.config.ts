import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { locale: 'ja-JP', baseURL: 'http://localhost:4170' },
  projects: [
    { name: 'mobile', grep: /@mobile/, use: { ...devices['iPhone 14'], browserName: 'chromium' } },
    { name: 'desktop', grep: /@desktop/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'vite --port 4170 --strictPort',
    url: 'http://localhost:4170',
    reuseExistingServer: true,
  },
});
