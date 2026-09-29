import { describe, expect, it } from 'vitest';
import { createRng } from '../src/rng';

describe('createRng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()));
  });

  it('stays within bounds', () => {
    const r = createRng(1);
    for (let i = 0; i < 1000; i++) {
      const n = r.int(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
  });

  it('shuffles in place without losing items', () => {
    const arr = [1, 2, 3, 4, 5, 6];
    createRng(3).shuffle(arr);
    expect([...arr].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('refuses to pick from an empty array', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });
});
