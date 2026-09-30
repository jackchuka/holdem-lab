import { describe, expect, it } from 'vitest';
import { computeFortune } from './fortune';
import { renderShareImage, type CanvasLike } from './shareImage';

const fortune = computeFortune({ kind: 'name', name: 'taro' }, '2026-09-30');
const labels = { tier: '中吉', hand: 'フルハウス', date: '2026/9/30' };

function fakeCanvas(withContext: boolean, missing: string[] = []) {
  const texts: string[] = [];
  const noop = () => undefined;
  const ctx = new Proxy(
    {
      fillText: (t: string) => void texts.push(t),
      createRadialGradient: () => ({ addColorStop: noop }),
    },
    {
      get: (target, p) => (p in target ? target[p as keyof typeof target] : missing.includes(String(p)) ? undefined : noop),
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D;
  const canvas: CanvasLike = {
    width: 0,
    height: 0,
    getContext: () => (withContext ? ctx : null),
    toBlob: (cb, type) => cb(new Blob(['png'], { type })),
  };
  return { canvas, texts };
}

describe('renderShareImage', () => {
  it('draws the labels and the site URL on a 1200x630 canvas', async () => {
    const { canvas, texts } = fakeCanvas(true);
    const blob = await renderShareImage(fortune, labels, canvas);
    expect(blob?.type).toBe('image/png');
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(630);
    expect(texts).toEqual(expect.arrayContaining(['中吉', 'フルハウス', 'holdem-lab.com/fortune']));
    expect(texts.some((t) => t.includes('2026/9/30'))).toBe(true);
  });

  it('returns null when drawing throws, e.g. without roundRect', async () => {
    expect(await renderShareImage(fortune, labels, fakeCanvas(true, ['roundRect']).canvas)).toBeNull();
  });

  it('returns null without a 2d context', async () => {
    expect(await renderShareImage(fortune, labels, fakeCanvas(false).canvas)).toBeNull();
  });
});
