export type SiteApp = { id: string; title: string; ja: string; en: string };

const MARKER = '<!-- apps -->';
const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

function card(app: SiteApp): string {
  const id = escape(app.id);
  return `      <a href="${id}/">
        <img src="${id}/icon.svg" alt="" />
        <span><b>${escape(app.title)}</b>${escape(app.ja)} / ${escape(app.en)}</span>
      </a>`;
}

export function renderSiteIndex(
  template: string,
  apps: readonly SiteApp[],
  opts: { beaconSrc: string; beaconToken?: string },
): string {
  if (!template.includes(MARKER)) throw new Error(`site-root template is missing the ${MARKER} marker`);
  let html = template.replace(new RegExp(`^[ \\t]*${MARKER}`, 'm'), apps.map(card).join('\n'));
  if (opts.beaconToken) {
    const beacon = `<script type="module" src="${opts.beaconSrc}" data-cf-beacon='${JSON.stringify({ token: opts.beaconToken })}'></script>`;
    html = html.replace('</body>', `${beacon}</body>`);
  }
  return html;
}
