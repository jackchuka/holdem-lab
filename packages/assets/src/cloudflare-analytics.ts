export const CF_BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

// Only builds that set CF_BEACON_TOKEN (the Pages deploy) report to Cloudflare Web Analytics; dev, e2e and forks do not.
export function cloudflareAnalytics(token: string | undefined) {
  return {
    name: 'cloudflare-analytics',
    apply: 'build' as const,
    transformIndexHtml: () =>
      token
        ? [{ tag: 'script', attrs: { type: 'module', src: CF_BEACON_SRC, 'data-cf-beacon': JSON.stringify({ token }) }, injectTo: 'body' as const }]
        : [],
  };
}
