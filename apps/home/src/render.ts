export type HomeApp = { id: string; title: string; ja: string; en: string; shot: string; lead: { ja: string; en: string } };

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const bi = (ja: string, en: string) => `<span lang="ja">${escape(ja)}</span><span lang="en">${escape(en)}</span>`;

function article(app: HomeApp, url: string, index: number): string {
  const lazy = index === 0 ? '' : ' loading="lazy"';
  return `<article class="app" id="app-${escape(app.id)}">
      <a class="shot" href="${url}" tabindex="-1" aria-hidden="true"><img src="shots/${escape(app.shot)}" alt="" width="587" height="1000"${lazy} /></a>
      <div class="info">
        <h2><a href="${url}"><img src="${url}icon.svg" alt="" width="32" height="32" />${escape(app.title)}</a></h2>
        <p class="short">${bi(app.ja, app.en)}</p>
        <p class="lead">${bi(app.lead.ja, app.lead.en)}</p>
        <a class="open" href="${url}">${bi('開く', 'Open')} →</a>
      </div>
    </article>`;
}

function tab(app: HomeApp, url: string, index: number): string {
  const id = escape(app.id);
  return `<button type="button" class="tab" data-app="${id}" aria-controls="app-${id}" aria-current="${index === 0}" aria-label="${escape(app.title)}"><img src="${url}icon.svg" alt="" width="44" height="44" /></button>`;
}

function fill(html: string, marker: string, parts: string[]): string {
  if (!html.includes(marker)) throw new Error(`home template is missing the ${marker} marker`);
  return html.replace(new RegExp(`^[ \\t]*${marker}`, 'm'), parts.join('\n'));
}

export function renderHome(template: string, apps: readonly HomeApp[], appUrl: (id: string) => string): string {
  const urls = apps.map((a) => escape(appUrl(a.id)));
  const html = fill(template, '<!-- apps -->', apps.map((a, i) => article(a, urls[i], i)));
  return fill(html, '<!-- tabs -->', apps.map((a, i) => tab(a, urls[i], i)));
}
