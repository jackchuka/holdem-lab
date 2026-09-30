import { describe, expect, it } from 'vitest';
import { computeFortune } from './fortune';
import { renderShareImage, type CanvasLike } from './shareImage';

const fortune = computeFortune({ kind: 'name', name: 'taro' }, '2026-09-30');
const labels = {
  tier: '中吉',
  hand: 'フルハウス',
  date: '2026/9/30',
  comment: '押すべき日。ただし降りる勇気も忘れずに。',
  handPower: '手札力',
  lucky: ['ラッキーポジション', 'ラッキースート', 'ラッキーサイズ'] as [string, string, string],
};

function fakeCanvas(withContext: boolean, missing: string[] = []) {
  const texts: string[] = [];
  const noop = () => undefined;
  const ctx = new Proxy(
    {
      fillText: (t: string) => void texts.push(t),
      createRadialGradient: () => ({ addColorStop: noop }),
      measureText: (t: string) => ({ width: t.length * 28 }),
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
  it('wraps the comment and draws the hand power and lucky items', async () => {
    const { canvas, texts } = fakeCanvas(true);
    await renderShareImage(fortune, labels, canvas);
    expect(texts).toEqual(expect.arrayContaining([fortune.handClass, `${fortune.luckySize}%`, fortune.luckyPosition, ...labels.lucky]));
    expect(texts.filter((t) => labels.comment.includes(t) && t.length > 1)).toHaveLength(2);
    expect(texts.filter((t) => labels.comment.includes(t)).join('')).toBe(labels.comment);
  });

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
