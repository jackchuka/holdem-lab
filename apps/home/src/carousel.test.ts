import { describe, expect, it } from 'vitest';
import { isFullyVisible, mountCarousel, stepIndex, visibleIndex } from './carousel';

describe('stepIndex', () => {
  it('moves with the arrow keys and stops at the ends', () => {
    expect(stepIndex(1, 'ArrowRight', 4)).toBe(2);
    expect(stepIndex(1, 'ArrowLeft', 4)).toBe(0);
    expect(stepIndex(0, 'ArrowLeft', 4)).toBe(0);
    expect(stepIndex(3, 'ArrowRight', 4)).toBe(3);
    expect(stepIndex(2, 'Enter', 4)).toBe(2);
  });
});

describe('visibleIndex', () => {
  it('rounds the scroll offset to the nearest item within range', () => {
    expect(visibleIndex(0, 296, 4)).toBe(0);
    expect(visibleIndex(140, 296, 4)).toBe(0);
    expect(visibleIndex(160, 296, 4)).toBe(1);
    expect(visibleIndex(296 * 3, 296, 4)).toBe(3);
    expect(visibleIndex(99999, 296, 4)).toBe(3);
    expect(visibleIndex(-20, 296, 4)).toBe(0);
    expect(visibleIndex(500, 0, 4)).toBe(0);
  });
});

describe('isFullyVisible', () => {
  it('is true only when the item sits inside the view, allowing a pixel of rounding', () => {
    expect(isFullyVisible({ left: 16, right: 296 }, { left: 0, right: 820 })).toBe(true);
    expect(isFullyVisible({ left: -0.5, right: 280 }, { left: 0, right: 820 })).toBe(true);
    expect(isFullyVisible({ left: -40, right: 240 }, { left: 0, right: 820 })).toBe(false);
    expect(isFullyVisible({ left: 700, right: 980 }, { left: 0, right: 820 })).toBe(false);
  });
});

function query(matches: boolean): MediaQueryList {
  return { matches, addEventListener: () => {}, removeEventListener: () => {} } as unknown as MediaQueryList;
}

function dom() {
  document.body.innerHTML = `<section id="rail">${['a', 'b', 'c'].map((id) => `<article class="app" id="app-${id}"></article>`).join('')}</section>
    <nav id="tabs">${['a', 'b', 'c'].map((id, i) => `<button class="tab" data-app="${id}" aria-current="${i === 0}"></button>`).join('')}</nav>`;
  const rail = document.getElementById('rail')!;
  const tabs = document.getElementById('tabs')!;
  const items = [...rail.querySelectorAll<HTMLElement>('.app')];
  const buttons = [...tabs.querySelectorAll<HTMLButtonElement>('.tab')];
  const current = () => buttons.map((b) => b.getAttribute('aria-current'));
  const active = () => items.map((it) => it.hasAttribute('data-active'));
  return { rail, tabs, items, buttons, current, active };
}

describe('mountCarousel', () => {
  it('starts on the first app', () => {
    const d = dom();
    mountCarousel(d.rail, d.tabs, query(true), query(false));
    expect(d.current()).toEqual(['true', 'false', 'false']);
    expect(d.active()).toEqual([true, false, false]);
  });

  it('selects an app from its tab and with the arrow keys', () => {
    const d = dom();
    mountCarousel(d.rail, d.tabs, query(true), query(false));
    d.buttons[2].click();
    expect(d.active()).toEqual([false, false, true]);
    d.tabs.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(d.current()).toEqual(['false', 'true', 'false']);
    expect(document.activeElement).toBe(d.buttons[1]);
  });

  it('scrolls the rail to the tapped app outside the stage layout', () => {
    const d = dom();
    const scrolled: string[] = [];
    d.items.forEach((it) => (it.scrollIntoView = () => void scrolled.push(it.id)));
    mountCarousel(d.rail, d.tabs, query(false), query(false));
    d.buttons[1].click();
    expect(scrolled).toEqual(['app-b']);
  });
});
