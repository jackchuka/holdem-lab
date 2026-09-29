import { describe, expect, it } from 'vitest';
import { multiEquity, parseCard, parseCards, type PlayerInput } from '@holdem-lab/engine';
import { classCells, heatColor, nextCardCells, nextCardSummary } from './analysis';

const hand = (s: string): PlayerInput => {
  const [a, b] = parseCards(s);
  return { kind: 'hand', cards: [a, b] };
};

describe('heatColor', () => {
  it('mixes toward positive or negative and saturates at the span', () => {
    expect(heatColor(0, 0.3)).toBe('color-mix(in srgb, var(--heat-pos) 0%, var(--heat-mid))');
    expect(heatColor(0.15, 0.3)).toBe('color-mix(in srgb, var(--heat-pos) 50%, var(--heat-mid))');
    expect(heatColor(-0.9, 0.3)).toBe('color-mix(in srgb, var(--heat-neg) 100%, var(--heat-mid))');
  });
});

describe('next card cells', () => {
  it('computes per-card equity and deltas from the current equity', () => {
    const stats = multiEquity([hand('AsAh'), hand('KsKh')], parseCards('2c7d9h'), { mode: 'exact', trackNextCard: true });
    const cells = nextCardCells(stats, 0);
    expect(cells).toHaveLength(45);
    const kc = cells.find((c) => c.card === parseCard('Kc'))!;
    expect(kc.equity).toBeCloseTo(2 / 44, 9);
    expect(kc.delta).toBeLessThan(0);
    const summary = nextCardSummary(cells)!;
    expect([parseCard('Kc'), parseCard('Kd')]).toContain(summary.worst.card);
    expect(summary.down).toBe(2);
    expect(summary.total).toBe(45);
  });

  it('returns nothing without tracking', () => {
    expect(nextCardCells(multiEquity([hand('AsAh'), hand('KsKh')], parseCards('2c7d9h3s4d')), 0)).toEqual([]);
    expect(nextCardSummary([])).toBeNull();
  });
});

describe('class cells', () => {
  it('reports focus equity per opponent hand class and fades thin samples', () => {
    const stats = multiEquity(
      [hand('AsAh'), { kind: 'range', combos: [
        { combo: [parseCard('Kh'), parseCard('Kc')], weight: 1 },
        { combo: [parseCard('Qh'), parseCard('Qc')], weight: 1 },
      ] }],
      parseCards('Kd7c2h3s9d'),
      { trackClassesOf: 1 },
    );
    const cells = classCells(stats);
    expect(cells.get('KK')).toEqual({ equity: 0, weight: 1, faded: false });
    expect(cells.get('QQ')).toEqual({ equity: 1, weight: 1, faded: false });
    expect(cells.has('AKo')).toBe(false);
  });
});
