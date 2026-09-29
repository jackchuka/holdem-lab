import { rankOf, suitOf, type Card } from './cards';

export const HandCategory = {
  HighCard: 0,
  OnePair: 1,
  TwoPair: 2,
  Trips: 3,
  Straight: 4,
  Flush: 5,
  FullHouse: 6,
  Quads: 7,
  StraightFlush: 8,
} as const;
export type HandCategory = (typeof HandCategory)[keyof typeof HandCategory];
export type HandRank = number;

const BASE = 13 ** 5;

function score(category: HandCategory, ranks: number[]): HandRank {
  let v = 0;
  for (let i = 0; i < 5; i++) v = v * 13 + (ranks[i] ?? 0);
  return category * BASE + v;
}

export function straightHigh(mask: number): number {
  for (let hi = 12; hi >= 4; hi--) {
    const need = 0b11111 << (hi - 4);
    if ((mask & need) === need) return hi;
  }
  const wheel = (1 << 12) | 0b1111;
  return (mask & wheel) === wheel ? 3 : -1;
}

export function evaluate(cards: readonly Card[]): HandRank {
  if (cards.length < 5 || cards.length > 7) throw new Error(`evaluate needs 5-7 cards, got ${cards.length}`);
  const counts = Array.from({ length: 13 }, () => 0);
  const suitMasks = [0, 0, 0, 0];
  const suitCounts = [0, 0, 0, 0];
  let mask = 0;
  for (const c of cards) {
    const r = rankOf(c);
    const s = suitOf(c);
    counts[r]++;
    suitMasks[s] |= 1 << r;
    suitCounts[s]++;
    mask |= 1 << r;
  }

  let flushMask = 0;
  for (let s = 0; s < 4; s++) if (suitCounts[s] >= 5) flushMask = suitMasks[s];
  if (flushMask) {
    const sf = straightHigh(flushMask);
    if (sf >= 0) return score(HandCategory.StraightFlush, [sf]);
  }

  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  for (let r = 12; r >= 0; r--) {
    if (counts[r] === 4) quads.push(r);
    else if (counts[r] === 3) trips.push(r);
    else if (counts[r] === 2) pairs.push(r);
  }
  const kickers = (exclude: number[], n: number) => {
    const out: number[] = [];
    for (let r = 12; r >= 0 && out.length < n; r--) if (counts[r] > 0 && !exclude.includes(r)) out.push(r);
    return out;
  };

  if (quads.length) return score(HandCategory.Quads, [quads[0], ...kickers([quads[0]], 1)]);
  if (trips.length && (trips.length > 1 || pairs.length)) {
    return score(HandCategory.FullHouse, [trips[0], Math.max(trips[1] ?? -1, pairs[0] ?? -1)]);
  }
  if (flushMask) {
    const top: number[] = [];
    for (let r = 12; r >= 0 && top.length < 5; r--) if (flushMask & (1 << r)) top.push(r);
    return score(HandCategory.Flush, top);
  }
  const st = straightHigh(mask);
  if (st >= 0) return score(HandCategory.Straight, [st]);
  if (trips.length) return score(HandCategory.Trips, [trips[0], ...kickers([trips[0]], 2)]);
  if (pairs.length >= 2) return score(HandCategory.TwoPair, [pairs[0], pairs[1], ...kickers([pairs[0], pairs[1]], 1)]);
  if (pairs.length) return score(HandCategory.OnePair, [pairs[0], ...kickers([pairs[0]], 3)]);
  return score(HandCategory.HighCard, kickers([], 5));
}

export function categoryOf(rank: HandRank): HandCategory {
  return Math.floor(rank / BASE) as HandCategory;
}

export function compareHands(a: HandRank, b: HandRank): -1 | 0 | 1 {
  return a > b ? 1 : a < b ? -1 : 0;
}
