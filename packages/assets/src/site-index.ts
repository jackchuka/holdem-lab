export type SiteApp = { id: string; title: string; ja: string; en: string };

const MARKER = '<!-- apps -->';
const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

function card(app: SiteApp, appUrl: (id: string) => string): string {
  const url = escape(appUrl(app.id));
  return `      <a href="${url}">
        <img src="${url}icon.svg" alt="" />
        <span><b>${escape(app.title)}</b>${escape(app.ja)} / ${escape(app.en)}</span>
      </a>`;
}

export function renderSiteIndex(
  template: string,
  apps: readonly SiteApp[],
  opts: { beaconSrc: string; beaconToken?: string; appUrl?: (id: string) => string },
): string {
  if (!template.includes(MARKER)) throw new Error(`site-root template is missing the ${MARKER} marker`);
  let html = template.replace(new RegExp(`^[ \\t]*${MARKER}`, 'm'), apps.map((app) => card(app, opts.appUrl ?? ((id) => `${id}/`))).join('\n'));
  if (opts.beaconToken) {
    const beacon = `<script type="module" src="${opts.beaconSrc}" data-cf-beacon='${JSON.stringify({ token: opts.beaconToken })}'></script>`;
    html = html.replace('</body>', `${beacon}</body>`);
  }
  return html;
}
