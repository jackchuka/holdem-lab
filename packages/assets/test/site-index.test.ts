import { describe, expect, it } from 'vitest';
import { renderSiteIndex } from '../src/site-index';

const TEMPLATE = '<html><body><main>\n<!-- apps -->\n</main></body></html>';
const APPS = [
  { id: 'b', title: 'Bee', ja: 'ビー', en: 'Bee app' },
  { id: 'a', title: 'Ant', ja: '<アリ> & "蟻"', en: "Ant's app" },
];
const SRC = 'https://example.com/beacon.js';

describe('renderSiteIndex', () => {
  it('renders one card per app in list order', () => {
    const html = renderSiteIndex(TEMPLATE, APPS, { beaconSrc: SRC });
    expect(html.indexOf('href="b/"')).toBeGreaterThan(-1);
    expect(html.indexOf('href="b/"')).toBeLessThan(html.indexOf('href="a/"'));
    expect(html).toContain('<img src="b/icon.svg" alt="" />');
    expect(html).toContain('<b>Bee</b>ビー / Bee app');
    expect(html).not.toContain('<!-- apps -->');
  });

  it('links cards through appUrl, e.g. to dev servers', () => {
    const html = renderSiteIndex(TEMPLATE, APPS, { beaconSrc: SRC, appUrl: (id) => `http://localhost:9/${id}-x/` });
    expect(html).toContain('<a href="http://localhost:9/b-x/">');
    expect(html).toContain('<img src="http://localhost:9/b-x/icon.svg" alt="" />');
  });

  it('escapes text', () => {
    const html = renderSiteIndex(TEMPLATE, APPS, { beaconSrc: SRC });
    expect(html).toContain('&lt;アリ&gt; &amp; &quot;蟻&quot; / Ant&#39;s app');
  });

  it('adds the analytics beacon only with a token', () => {
    expect(renderSiteIndex(TEMPLATE, APPS, { beaconSrc: SRC })).not.toContain('beacon');
    const html = renderSiteIndex(TEMPLATE, APPS, { beaconSrc: SRC, beaconToken: 'tok' });
    expect(html).toContain(`<script type="module" src="${SRC}" data-cf-beacon='{"token":"tok"}'></script></body>`);
  });

  it('rejects a template without the apps marker', () => {
    expect(() => renderSiteIndex('<html></html>', APPS, { beaconSrc: SRC })).toThrow(/<!-- apps -->/);
  });
});
