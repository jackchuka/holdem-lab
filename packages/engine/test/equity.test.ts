import { describe, expect, it } from 'vitest';
import { parseCards } from '../src/cards';
import { equity } from '../src/equity';

const eq = (h: string, v: string, b = '', iterations = 50000) =>
  equity(parseCards(h), parseCards(v), parseCards(b), { iterations, seed: 7 }).equity;

describe('equity', () => {
  it('matches known preflop matchups', () => {
    expect(eq('AhAd', 'KsKc')).toBeCloseTo(0.82, 1);
    expect(Math.abs(eq('AhAd', 'KsKc') - 0.82)).toBeLessThan(0.015);
    expect(Math.abs(eq('AsKd', 'QhQc') - 0.43)).toBeLessThan(0.015);
  });

  it('is exact on the river', () => {
    expect(eq('AsAh', 'QcQd', 'KsKd2c7h9s')).toBe(1);
    expect(eq('2c3d', '4h5s', 'AsKsQsJsTs')).toBe(0.5);
  });

  it('rejects duplicate cards', () => {
    expect(() => eq('AsKs', 'AsQd')).toThrow();
  });

  it('reports win and tie shares', () => {
    const r = equity(parseCards('2c3d'), parseCards('4h5s'), parseCards('AsKsQsJsTs'));
    expect(r).toEqual({ equity: 0.5, win: 0, tie: 1, iterations: 1 });
  });
});
