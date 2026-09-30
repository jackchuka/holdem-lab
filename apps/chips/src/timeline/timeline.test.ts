import { describe, expect, it } from 'vitest';
import type { Trick, Vec3 } from '../tricks/types';
import { rotate } from './math';
import { keyWindow, poseAt, stepAt, wrap } from './timeline';

const close = (a: Vec3, b: Vec3) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i], 6));

const trick: Trick = {
  id: 'thumb-flip',
  name: { ja: 'テスト', en: 'Test' },
  duration: 2,
  floor: -10,
  focus: [0, 0, 0],
  chips: [{ id: 'c', color: '#fff' }],
  fingers: ['thumb'],
  steps: [
    { from: 0, to: 1, text: { ja: '一', en: 'one' } },
    { from: 1, to: 2, text: { ja: '二', en: 'two' } },
  ],
  tracks: {
    chips: {
      c: [
        { t: 0, pos: [0, 0, 0], rot: [0, 0, 0] },
        { t: 1, pos: [10, 0, 0], rot: [0, 0, 0] },
        { t: 2, pos: [10, 20, 0], rot: [180, 0, 0], ease: 'in' },
      ],
    },
    fingers: {
      thumb: [
        { t: 0, pos: [0, 0, 0], press: false },
        { t: 0.5, pos: [4, 0, 0], press: true, ease: 'linear' },
        { t: 1.5, pos: [4, 0, 0], press: false },
        { t: 2, pos: [0, 0, 0], press: false },
      ],
    },
  },
};

describe('wrap', () => {
  it('folds time into [0, duration)', () => {
    expect(wrap(2.5, 2)).toBeCloseTo(0.5);
    expect(wrap(-0.5, 2)).toBeCloseTo(1.5);
    expect(wrap(2, 2)).toBe(0);
  });
});

describe('keyWindow', () => {
  const keys = trick.tracks.chips.c;
  it('finds the segment around t', () => expect(keyWindow(keys, 1.2)).toMatchObject({ prev: 1, next: 2 }));
  it('holds the first and last keys outside the range', () => {
    const late = [{ t: 0.5, pos: [1, 1, 1] as Vec3, press: true }, { t: 1.5, pos: [2, 2, 2] as Vec3, press: false }];
    expect(keyWindow(late, 0.2)).toEqual({ prev: 0, next: 0, k: 0 });
    expect(keyWindow(late, 1.8)).toEqual({ prev: 1, next: 1, k: 0 });
  });
});

describe('poseAt', () => {
  it('hits key values exactly', () => close(poseAt(trick, 1).chips.c.pos, [10, 0, 0]));
  it('eases in and out by default', () => close(poseAt(trick, 0.25).chips.c.pos, [1.25, 0, 0]));
  it('uses the ease of the key that ends the segment', () => close(poseAt(trick, 1.5).chips.c.pos, [10, 5, 0]));
  it('moves fingers linearly when asked', () => close(poseAt(trick, 0.25).fingers.thumb!.pos, [2, 0, 0]));
  it('wraps time', () => {
    close(poseAt(trick, 2.25).chips.c.pos, poseAt(trick, 0.25).chips.c.pos);
    close(poseAt(trick, -0.5).chips.c.pos, poseAt(trick, 1.5).chips.c.pos);
  });

  it('rotates by interpolated angles', () => {
    close(rotate(poseAt(trick, 1.5).chips.c.quat, [0, 1, 0]), [0, Math.SQRT1_2, Math.SQRT1_2]);
    close(rotate(poseAt(trick, 1.999999999).chips.c.quat, [0, 1, 0]), [0, -1, 0]);
  });

  it('keeps full turns within one segment', () => {
    const spin: Trick = { ...trick, tracks: { ...trick.tracks, chips: { c: [{ t: 0, pos: [0, 0, 0], rot: [0, 0, 0] }, { t: 2, pos: [0, 0, 0], rot: [360, 0, 0], ease: 'linear' }] } } };
    close(rotate(poseAt(spin, 1).chips.c.quat, [0, 1, 0]), [0, -1, 0]);
  });

  it('presses from a pressing key until the next key', () => {
    expect(poseAt(trick, 0.49).fingers.thumb!.press).toBe(false);
    expect(poseAt(trick, 0.5).fingers.thumb!.press).toBe(true);
    expect(poseAt(trick, 1.49).fingers.thumb!.press).toBe(true);
    expect(poseAt(trick, 1.5).fingers.thumb!.press).toBe(false);
  });
});

describe('stepAt', () => {
  it('finds the step containing t', () => {
    expect(stepAt(trick, 0)).toBe(0);
    expect(stepAt(trick, 0.99)).toBe(0);
    expect(stepAt(trick, 1)).toBe(1);
    expect(stepAt(trick, 1.99)).toBe(1);
  });

  it('wraps time', () => {
    expect(stepAt(trick, 2)).toBe(0);
    expect(stepAt(trick, -0.01)).toBe(1);
  });
});

describe('wrap precision', () => {
  it('returns times already inside the loop unchanged', () => {
    for (const t of [0.6, 0.9, 1.2, 1.6, 2.8]) expect(wrap(t, 3.6)).toBe(t);
  });
});
