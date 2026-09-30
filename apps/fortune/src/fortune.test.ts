import { HandCategory, parseCards } from '@holdem-lab/engine';
import { describe, expect, it } from 'vitest';
import {
  LUCKY_SIZES,
  POSITIONS,
  TIERS,
  categorize,
  computeFortune,
  fnv1a32,
  keyString,
  normalizeName,
  tierOf,
  type Tier,
} from './fortune';
import { PREFLOP_EQUITY } from './preflopEquity';

describe('normalizeName', () => {
  it('trims, applies NFKC and lowercases', () => {
    expect(normalizeName(' Taro ')).toBe('taro');
    expect(normalizeName('ｔａｒｏ')).toBe('taro');
    expect(normalizeName('TARO')).toBe('taro');
    expect(normalizeName('たろう 🂡')).toBe('たろう 🂡');
    expect(normalizeName('   ')).toBe('');
  });
});

describe('keyString', () => {
  it('prefixes device ids with u and names with n', () => {
    expect(keyString({ kind: 'device', id: 'abc' })).toBe('uabc');
    expect(keyString({ kind: 'name', name: ' Taro ' })).toBe('ntaro');
  });
});

describe('fnv1a32', () => {
  it('matches the reference FNV-1a values', () => {
    expect(fnv1a32('')).toBe(0x811c9dc5);
    expect(fnv1a32('a')).toBe(0xe40c292c);
  });
});

describe('categorize', () => {
  it('distinguishes a royal flush from other straight flushes', () => {
    expect(categorize(parseCards('AsKsQsJsTs2h3d')).category).toBe('RoyalFlush');
    expect(categorize(parseCards('KsQsJsTs9s2h3d')).category).toBe(HandCategory.StraightFlush);
    expect(categorize(parseCards('As2s3s4s5sKhKd')).category).toBe(HandCategory.StraightFlush);
  });

  it('returns the five cards that make the hand', () => {
    const r = categorize(parseCards('AhKsAdKcKh7s2c'));
    expect(r.category).toBe(HandCategory.FullHouse);
    expect([...r.bestFive].sort((a, b) => a - b)).toEqual(parseCards('AhKsAdKcKh').sort((a, b) => a - b));
  });
});

describe('tierOf', () => {
  it.each<[Parameters<typeof tierOf>[0], Tier]>([
    ['RoyalFlush', 'chodaikichi'],
    [HandCategory.StraightFlush, 'daikichi'],
    [HandCategory.Quads, 'daikichi'],
    [HandCategory.FullHouse, 'chukichi'],
    [HandCategory.Flush, 'chukichi'],
    [HandCategory.Straight, 'kichi'],
    [HandCategory.Trips, 'kichi'],
    [HandCategory.TwoPair, 'shokichi'],
    [HandCategory.OnePair, 'suekichi'],
    [HandCategory.HighCard, 'kyo'],
  ])('%s → %s', (category, tier) => {
    expect(tierOf(category)).toBe(tier);
  });
});

describe('computeFortune', () => {
  const key = { kind: 'device', id: '0123456789abcdef' } as const;

  it('is deterministic for the same key and date', () => {
    expect(computeFortune(key, '2026-09-30')).toEqual(computeFortune(key, '2026-09-30'));
    expect(computeFortune({ kind: 'name', name: 'Taro' }, '2026-09-30')).toEqual(
      computeFortune({ kind: 'name', name: ' ｔａｒｏ ' }, '2026-09-30'),
    );
  });

  it('changes with the key or the date', () => {
    const base = computeFortune(key, '2026-09-30');
    const otherDate = computeFortune(key, '2026-10-01');
    const otherKey = computeFortune({ kind: 'device', id: 'fedcba9876543210' }, '2026-09-30');
    expect(otherDate.hand.concat(otherDate.board)).not.toEqual(base.hand.concat(base.board));
    expect(otherKey.hand.concat(otherKey.board)).not.toEqual(base.hand.concat(base.board));
  });

  it('deals seven distinct cards and fills every field', () => {
    const f = computeFortune(key, '2026-09-30');
    expect(new Set([...f.hand, ...f.board]).size).toBe(7);
    expect(f.board).toHaveLength(5);
    expect(f.bestFive).toHaveLength(5);
    expect(f.tier).toBe(tierOf(f.category));
    expect(f.preflopEquity).toBe(PREFLOP_EQUITY[f.handClass]);
    expect(POSITIONS).toContain(f.luckyPosition);
    expect(LUCKY_SIZES).toContain(f.luckySize);
    expect(f.luckySuit >= 0 && f.luckySuit < 4).toBe(true);
    expect(f.commentIndex >= 0 && f.commentIndex < 3).toBe(true);
    expect(f.tipIndex >= 0 && f.tipIndex < 20).toBe(true);
  });

  it('produces tiers close to the seven-card hand frequencies', () => {
    const n = 10_000;
    const counts = Object.fromEntries(TIERS.map((t) => [t, 0])) as Record<Tier, number>;
    for (let i = 0; i < n; i++) counts[computeFortune({ kind: 'device', id: String(i) }, '2026-09-30').tier]++;
    const share = (t: Tier) => counts[t] / n;
    expect(Math.abs(share('kyo') - 0.174)).toBeLessThan(0.02);
    expect(Math.abs(share('suekichi') - 0.438)).toBeLessThan(0.02);
    expect(Math.abs(share('shokichi') - 0.235)).toBeLessThan(0.02);
    expect(Math.abs(share('kichi') - 0.0945)).toBeLessThan(0.015);
    expect(Math.abs(share('chukichi') - 0.0563)).toBeLessThan(0.01);
  });
});
