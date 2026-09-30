import { describe, expect, it } from 'vitest';
import type { Trick } from '../tricks/types';
import { TRICKS } from '../tricks';
import { MAX_DT, advance, clampSeek, jumpStep } from './playback';

const steps = (bounds: number[]) => bounds.slice(1).map((to, i) => ({ from: bounds[i], to, text: { ja: '', en: '' } }));
const trick = { duration: 3, steps: steps([0, 1, 2, 3]) } as Trick;

describe('advance', () => {
  it('moves by dt times speed and loops', () => {
    expect(advance(0.5, 0.04, 0.5, 3)).toBeCloseTo(0.52);
    expect(advance(2.99, 0.02, 1, 3)).toBeCloseTo(0.01);
  });

  it('never steps backwards when the first frame is timestamped before playback started', () => {
    expect(advance(0, -0.004, 1, 3)).toBe(0);
  });

  it('caps a long pause (a tab in the background) at one short step', () => {
    expect(advance(1, 30, 1, 3)).toBeCloseTo(1 + MAX_DT);
  });
});

describe('clampSeek', () => {
  it('keeps the very end on the last step instead of looping to the start', () => {
    expect(clampSeek(3, 3)).toBeLessThan(3);
    expect(clampSeek(3, 3)).toBeGreaterThan(2.99);
  });
  it('clamps below zero', () => expect(clampSeek(-1, 3)).toBe(0));
});

describe('jumpStep', () => {
  it('goes to the start of the next or previous step', () => {
    expect(jumpStep(trick, 1.5, 1)).toBe(2);
    expect(jumpStep(trick, 1.5, -1)).toBe(0);
  });
  it('wraps around both ends', () => {
    expect(jumpStep(trick, 2.5, 1)).toBe(0);
    expect(jumpStep(trick, 0.2, -1)).toBe(2);
  });
});

describe('jumpStep on the real tricks', () => {
  it.each(TRICKS)('$id: ⏭ from the start of every step reaches the next step', (trick) => {
    trick.steps.forEach((s, i) => {
      expect(jumpStep(trick, s.from, 1), `from step ${i + 1}`).toBe(trick.steps[(i + 1) % trick.steps.length].from);
    });
  });
});
