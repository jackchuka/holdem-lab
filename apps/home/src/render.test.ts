import { describe, expect, it } from 'vitest';
import { bi, renderHome, type HomeApp } from './render';

const TEMPLATE = '<main>\n  <section id="rail" class="rail">\n    <!-- apps -->\n  </section>\n  <nav id="tabs" class="tabs">\n    <!-- tabs -->\n  </nav>\n</main>';
const APP = (id: string, over: Partial<HomeApp> = {}): HomeApp => ({ id, title: id.toUpperCase(), ja: `${id}の説明`, en: `${id} app`, shot: `${id}.png`, lead: { ja: `${id}の長い説明`, en: `${id} long lead` }, ...over });
const url = (id: string) => `../${id}/`;

describe('bi', () => {
  it('writes both languages as lang-tagged spans', () => {
    expect(bi('開く', 'Open')).toBe('<span lang="ja">開く</span><span lang="en">Open</span>');
  });
});

describe('renderHome', () => {
  it('renders one article and one tab per app in list order', () => {
    const html = renderHome(TEMPLATE, [APP('b'), APP('a')], url);
    expect(html.indexOf('id="app-b"')).toBeGreaterThan(-1);
    expect(html.indexOf('id="app-b"')).toBeLessThan(html.indexOf('id="app-a"'));
    expect(html.indexOf('data-app="b"')).toBeLessThan(html.indexOf('data-app="a"'));
    expect(html).not.toContain('<!-- apps -->');
    expect(html).not.toContain('<!-- tabs -->');
  });

  it('links the screenshot, title and open button through appUrl', () => {
    const html = renderHome(TEMPLATE, [APP('b')], (id) => `http://localhost:9/${id}-x/`);
    expect(html.match(/href="http:\/\/localhost:9\/b-x\/"/g)).toHaveLength(3);
    expect(html).toContain('src="http://localhost:9/b-x/icon.svg"');
  });

  it('points screenshots at shots/ and only lazy-loads the ones after the first', () => {
    const html = renderHome(TEMPLATE, [APP('b'), APP('a')], url);
    expect(html).toContain('<img src="shots/b.png" alt="" width="587" height="1000" />');
    expect(html).toContain('<img src="shots/a.png" alt="" width="587" height="1000" loading="lazy" />');
  });

  it('writes short and lead copy in both languages', () => {
    const html = renderHome(TEMPLATE, [APP('b')], url);
    expect(html).toContain(bi('bの説明', 'b app'));
    expect(html).toContain(bi('bの長い説明', 'b long lead'));
  });

  it('marks only the first tab as current and labels tabs by title', () => {
    const html = renderHome(TEMPLATE, [APP('b'), APP('a')], url);
    expect(html).toContain('data-app="b" aria-controls="app-b" aria-current="true" aria-label="B"');
    expect(html).toContain('data-app="a" aria-controls="app-a" aria-current="false" aria-label="A"');
  });

  it('escapes text', () => {
    const html = renderHome(TEMPLATE, [APP('a', { title: 'A&"B"', ja: '<アリ>', en: "Ant's" })], url);
    expect(html).toContain('A&amp;&quot;B&quot;');
    expect(html).toContain(bi('<アリ>', "Ant's"));
    expect(bi('<アリ>', "Ant's")).toBe('<span lang="ja">&lt;アリ&gt;</span><span lang="en">Ant&#39;s</span>');
  });

  it('rejects a template missing either marker', () => {
    expect(() => renderHome('<!-- tabs -->', [APP('a')], url)).toThrow(/<!-- apps -->/);
    expect(() => renderHome('<!-- apps -->', [APP('a')], url)).toThrow(/<!-- tabs -->/);
  });
});
