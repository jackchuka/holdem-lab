import { describe, expect, it } from 'vitest';
import { HAND_CLASSES } from '@holdem-lab/engine';
import { POSITIONS, RANGE_SETS_RAW, RangeValidationError, actionOf, isBoundary, loadRangeSet, rfiPercent } from '../src';

const raw = RANGE_SETS_RAW['6max-100bb-rfi'];

describe('loadRangeSet', () => {
  it('loads the bundled 6max set', () => {
    const set = loadRangeSet(raw);
    for (const p of POSITIONS) expect(Object.keys(set.spots[p])).toHaveLength(169);
    expect(actionOf(set.spots.UTG, 'AA')).toBe('raise');
    expect(actionOf(set.spots.UTG, 'A9o')).toBe('fold');
    expect(set.spots.UTG['44'].raise).toBe(0.5);
    expect(rfiPercent(set.spots.UTG)).toBeGreaterThan(15);
    expect(rfiPercent(set.spots.UTG)).toBeLessThan(21);
    expect(rfiPercent(set.spots.BTN)).toBeGreaterThan(40);
    expect(rfiPercent(set.spots.BTN)).toBeLessThan(52);
  });

  it('widens from UTG to BTN', () => {
    const set = loadRangeSet(raw);
    const pct = (['UTG', 'HJ', 'CO', 'BTN'] as const).map((p) => rfiPercent(set.spots[p]));
    for (let i = 1; i < pct.length; i++) expect(pct[i]).toBeGreaterThan(pct[i - 1]);
  });

  it('marks boundary hands', () => {
    const set = loadRangeSet(raw);
    expect(isBoundary(set.spots.UTG, 'ATo')).toBe(true);
    expect(isBoundary(set.spots.UTG, 'AA')).toBe(false);
    expect(isBoundary(set.spots.UTG, '44')).toBe(true);
    expect(HAND_CLASSES.some((hc) => isBoundary(set.spots.UTG, hc))).toBe(true);
  });

  it('rejects malformed input', () => {
    const base = raw as { spots: Record<string, unknown> };
    const bad: unknown[] = [
      null,
      { ...base, id: 1 },
      { ...base, spots: { ...base.spots, UTG: undefined } },
      { ...base, spots: { ...base.spots, UTG: { raise: { AKx: 1 } } } },
      { ...base, spots: { ...base.spots, UTG: { raise: { AA: 2 } } } },
      { ...base, spots: { ...base.spots, UTG: { raise: { AA: NaN } } } },
      { ...base, spots: { ...base.spots, BB: { raise: {} } } },
    ];
    for (const b of bad) expect(() => loadRangeSet(b)).toThrow(RangeValidationError);
  });
});
