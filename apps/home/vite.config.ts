import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { APPS, HOME_DEV_PORT } from '@holdem-lab/assets/apps';
import { cloudflareAnalytics } from '@holdem-lab/assets/vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { homeAppUrl } from './src/links.ts';
import { renderHome } from './src/render.ts';

const SHOTS = fileURLToPath(new URL('../../docs/assets/', import.meta.url));

// Writes the app list into index.html and serves/emits each app's screenshot from docs/assets as shots/<file>.
function home(mode: string): Plugin {
  const appUrl = homeAppUrl(mode);
  return {
    name: 'holdem-lab-home',
    transformIndexHtml: (html) => renderHome(html, APPS, appUrl),
    configureServer(server) {
      server.middlewares.use('/shots', (req, res, next) => {
        const name = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\//, ''));
        if (!APPS.some((a) => a.shot === name)) return next();
        res.setHeader('content-type', 'image/png');
        res.end(readFileSync(SHOTS + name));
      });
    },
    generateBundle() {
      for (const a of APPS) this.emitFile({ type: 'asset', fileName: `shots/${a.shot}`, source: readFileSync(SHOTS + a.shot) });
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH ?? '/',
  server: { port: HOME_DEV_PORT, strictPort: true },
  plugins: [home(mode), cloudflareAnalytics(process.env.CF_BEACON_TOKEN)],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
}));
