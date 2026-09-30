import {
  HandCategory,
  categoryOf,
  createRng,
  evaluate,
  fullDeck,
  handClassOf,
  rankOf,
  type Card,
} from '@holdem-lab/engine';
import { COMMENTS, TIPS } from './i18n/texts';
import { PREFLOP_EQUITY } from './preflopEquity';

export type FortuneKey = { kind: 'device'; id: string } | { kind: 'name'; name: string };
export const TIERS = ['chodaikichi', 'daikichi', 'chukichi', 'kichi', 'shokichi', 'suekichi', 'kyo'] as const;
export type Tier = (typeof TIERS)[number];
export type FortuneCategory = HandCategory | 'RoyalFlush';
export const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export const LUCKY_SIZES = [25, 33, 50, 66, 75, 100, 125, 150] as const;
export const NAME_MAX = 20;

export type Fortune = {
  hand: [Card, Card];
  board: Card[];
  bestFive: Card[];
  category: FortuneCategory;
  tier: Tier;
  handClass: string;
  preflopEquity: number;
  commentIndex: number;
  luckyPosition: string;
  luckySuit: number;
  luckySize: number;
  tipIndex: number;
};

export function normalizeName(name: string): string {
  return name.trim().normalize('NFKC').toLowerCase();
}

export function keyString(key: FortuneKey): string {
  return key.kind === 'device' ? `u${key.id}` : `n${normalizeName(key.name)}`;
}

export function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(s)) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h >>> 0;
}

export function categorize(seven: readonly Card[]): { category: FortuneCategory; bestFive: Card[] } {
  let bestRank = -1;
  let bestFive: Card[] = [];
  for (let a = 0; a < 7; a++) {
    for (let b = a + 1; b < 7; b++) {
      const five = seven.filter((_, i) => i !== a && i !== b);
      const rank = evaluate(five);
      if (rank > bestRank) {
        bestRank = rank;
        bestFive = five;
      }
    }
  }
  const category = categoryOf(bestRank);
  const royal =
    category === HandCategory.StraightFlush && bestFive.some((c) => rankOf(c) === 12) && bestFive.some((c) => rankOf(c) === 8);
  return { category: royal ? 'RoyalFlush' : category, bestFive };
}

export function tierOf(category: FortuneCategory): Tier {
  switch (category) {
    case 'RoyalFlush':
      return 'chodaikichi';
    case HandCategory.StraightFlush:
    case HandCategory.Quads:
      return 'daikichi';
    case HandCategory.FullHouse:
    case HandCategory.Flush:
      return 'chukichi';
    case HandCategory.Straight:
    case HandCategory.Trips:
      return 'kichi';
    case HandCategory.TwoPair:
      return 'shokichi';
    case HandCategory.OnePair:
      return 'suekichi';
    default:
      return 'kyo';
  }
}

export function computeFortune(key: FortuneKey, date: string): Fortune {
  const rng = createRng(fnv1a32(`${keyString(key)}:${date}`));
  const deck = rng.shuffle(fullDeck());
  const hand: [Card, Card] = [deck[0], deck[1]];
  const board = deck.slice(2, 7);
  const { category, bestFive } = categorize([...hand, ...board]);
  const tier = tierOf(category);
  const handClass = handClassOf(hand[0], hand[1]);
  return {
    hand,
    board,
    bestFive,
    category,
    tier,
    handClass,
    preflopEquity: PREFLOP_EQUITY[handClass],
    commentIndex: rng.int(COMMENTS.ja[tier].length),
    luckyPosition: rng.pick(POSITIONS),
    luckySuit: rng.int(4),
    luckySize: rng.pick(LUCKY_SIZES),
    tipIndex: rng.int(TIPS.ja.length),
  };
}
