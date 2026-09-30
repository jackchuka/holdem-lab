import { DEV_PORTS } from '@holdem-lab/assets/apps';
import { cloudflareAnalytics } from '@holdem-lab/assets/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: { port: DEV_PORTS.chips, strictPort: true },
  plugins: [
    react(),
    cloudflareAnalytics(process.env.CF_BEACON_TOKEN),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Chip Tricks',
        short_name: 'Chips',
        display: 'standalone',
        background_color: '#0d3b26',
        theme_color: '#0d3b26',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,ico}'] },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
