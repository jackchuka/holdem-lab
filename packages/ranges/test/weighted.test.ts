import { describe, expect, it } from 'vitest';
import { HAND_CLASSES, createRng } from '@holdem-lab/engine';
import { RANGE_SETS_RAW, loadRangeSet } from '../src';
import {
  comboStats,
  formatRange,
  fullRange,
  parseRange,
  rangeFromSpot,
  rangeToCombos,
  sameRange,
  type WeightedRange,
} from '../src/weighted';

const entries = (r: ReadonlyMap<string, number>) => [...r.entries()].sort(([a], [b]) => a.localeCompare(b));

describe('parseRange', () => {
  it('expands tokens with optional weights', () => {
    const { range, errors } = parseRange('TT+, AKs, AQo:0.5');
    expect(errors).toEqual([]);
    expect(entries(range)).toEqual(entries(new Map([['TT', 1], ['JJ', 1], ['QQ', 1], ['KK', 1], ['AA', 1], ['AKs', 1], ['AQo', 0.5]])));
  });

  it('keeps readable tokens and reports the rest with positions', () => {
    const text = 'QQ+, AK, 72o:2, A5s';
    const { range, errors } = parseRange(text);
    expect(entries(range).map(([hc]) => hc)).toEqual(['A5s', 'AA', 'KK', 'QQ']);
    expect(errors.map((e) => text.slice(e.start, e.end))).toEqual(['AK', '72o:2']);
    expect(errors.map((e) => e.token)).toEqual(['AK', '72o:2']);
  });

  it('ignores empty tokens while typing', () => {
    expect(parseRange('TT+,').errors).toEqual([]);
    expect(parseRange('').range.size).toBe(0);
  });

  it('rejects multiple colons in weight', () => {
    const { range, errors } = parseRange('AA:0.5:0.5');
    expect(errors).toHaveLength(1);
    expect(errors[0].token).toBe('AA:0.5:0.5');
    expect(range.size).toBe(0);
  });

  it('rejects empty weight after colon', () => {
    const { range, errors } = parseRange('AA:');
    expect(errors).toHaveLength(1);
    expect(errors[0].token).toBe('AA:');
    expect(range.size).toBe(0);
  });

  it('rejects whitespace-only weight', () => {
    const { range, errors } = parseRange('AA: ');
    expect(errors).toHaveLength(1);
    expect(errors[0].token).toBe('AA:');
    expect(range.size).toBe(0);
  });

  it('removes hand class when weight is 0', () => {
    const { range, errors } = parseRange('AA, AA:0');
    expect(errors).toEqual([]);
    expect(range.has('AA')).toBe(false);
  });

  it('rejects weight above 1', () => {
    const { range, errors } = parseRange('AA:1.5');
    expect(errors).toHaveLength(1);
    expect(errors[0].token).toBe('AA:1.5');
    expect(range.size).toBe(0);
  });

  it('reports error positions with leading whitespace and repeated tokens', () => {
    const text = '  AK, QQ, AK';
    const { range, errors } = parseRange(text);
    expect(entries(range).map(([hc]) => hc)).toEqual(['QQ']);
    expect(errors).toHaveLength(2);
    expect(errors.map((e) => text.slice(e.start, e.end))).toEqual(['AK', 'AK']);
  });

  it('round-trips pair runs, gapped suited runs, and offsuit singles', () => {
    const { range: r1 } = parseRange('99-66, K9s-K7s, K4s, QJo');
    const text = formatRange(r1);
    const { range: r2, errors } = parseRange(text);
    expect(errors).toEqual([]);
    expect(entries(r2)).toEqual(entries(r1));
  });
});

describe('formatRange', () => {
  it('compresses runs', () => {
    const { range } = parseRange('22+, A2s+, KTs, K9s, K8s, QJo, 44-22:0.5');
    expect(formatRange(range)).toBe('55+, A2s+, KTs-K8s, QJo, 44-22:0.5');
  });

  it('round-trips random weighted ranges', () => {
    const rng = createRng(4);
    for (let n = 0; n < 200; n++) {
      const r: WeightedRange = new Map();
      for (const hc of HAND_CLASSES) {
        const roll = rng.next();
        if (roll < 0.3) r.set(hc, 1);
        else if (roll < 0.4) r.set(hc, 0.5);
      }
      const text = formatRange(r);
      const back = parseRange(text);
      expect(back.errors).toEqual([]);
      expect(entries(back.range)).toEqual(entries(r));
    }
  });
});

describe('combos and presets', () => {
  it('expands to weighted combos', () => {
    const combos = rangeToCombos(new Map([['AA', 1], ['AKs', 0.5]]));
    expect(combos).toHaveLength(10);
    expect(combos.filter((c) => c.weight === 0.5)).toHaveLength(4);
  });

  it('counts weighted combos', () => {
    expect(comboStats(new Map([['AA', 1], ['AKo', 0.5]]))).toEqual({ combos: 12, percent: (12 / 1326) * 100 });
    expect(comboStats(fullRange())).toEqual({ combos: 1326, percent: 100 });
  });

  it('builds a preset from an RFI spot', () => {
    const set = loadRangeSet(RANGE_SETS_RAW['6max-100bb-rfi']);
    const utg = rangeFromSpot(set.spots.UTG);
    expect(utg.get('AA')).toBe(1);
    expect(utg.get('22')).toBe(0.5);
    expect(utg.has('72o')).toBe(false);
  });

  it('compares ranges by content', () => {
    expect(sameRange(new Map([['AA', 1]]), new Map([['AA', 1]]))).toBe(true);
    expect(sameRange(new Map([['AA', 1]]), new Map([['AA', 0.5]]))).toBe(false);
    expect(sameRange(new Map([['AA', 1]]), new Map())).toBe(false);
  });
});
