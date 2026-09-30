import { RANKS, fullDeck, rankOf, suitOf, type Card } from './cards';
import { HandCategory, categoryOf, evaluate, type HandRank } from './evaluator';

export type PatternCard = { rank: number | null; suit: number | null };
export type HandPattern = [PatternCard, PatternCard];
export type NutTier = { category: HandCategory; patterns: HandPattern[] };

type Combo = { a: Card; b: Card; rank: HandRank };

const GLYPHS = ['♠', '♥', '♦', '♣'];

const pairKey = (a: Card, b: Card) => (a < b ? a * 52 + b : b * 52 + a);
const specificity = (p: PatternCard) => (p.rank !== null ? 2 : 0) + (p.suit !== null ? 1 : 0);
const exact = (c: Card): PatternCard => ({ rank: rankOf(c), suit: suitOf(c) });

export function matchesPatternCard(p: PatternCard, c: Card): boolean {
  return (p.rank === null || p.rank === rankOf(c)) && (p.suit === null || p.suit === suitOf(c));
}

export function matchesPattern(p: HandPattern, a: Card, b: Card): boolean {
  return (matchesPatternCard(p[0], a) && matchesPatternCard(p[1], b)) || (matchesPatternCard(p[0], b) && matchesPatternCard(p[1], a));
}

export function patternCardToString(p: PatternCard): string {
  return (p.rank === null ? 'x' : RANKS[p.rank]) + (p.suit === null ? '' : GLYPHS[p.suit]);
}

export function patternToString(p: HandPattern): string {
  return `${patternCardToString(p[0])} ${patternCardToString(p[1])}`;
}

function normalize(p: HandPattern): HandPattern {
  const [x, y] = p;
  const d = specificity(y) - specificity(x) || (y.rank ?? -1) - (x.rank ?? -1) || (x.suit ?? 4) - (y.suit ?? 4);
  return d > 0 ? [y, x] : p;
}

function tierPatterns(tier: Combo[], deck: Card[], isPlaced: (a: Card, b: Card) => boolean): HandPattern[] {
  const covers = (p: HandPattern) => {
    let any = false;
    for (const a of deck) {
      if (!matchesPatternCard(p[0], a)) continue;
      for (const b of deck) {
        if (a === b || !matchesPatternCard(p[1], b)) continue;
        if (!isPlaced(a, b)) return false;
        any = true;
      }
    }
    return any;
  };
  const generalize = (c: Card, other: Card): PatternCard => {
    const options: PatternCard[] = [
      { rank: null, suit: null },
      { rank: null, suit: suitOf(c) },
      { rank: rankOf(c), suit: null },
    ];
    return options.find((p) => deck.every((y) => y === other || !matchesPatternCard(p, y) || isPlaced(y, other))) ?? exact(c);
  };

  const found = new Map<string, HandPattern>();
  for (const h of tier) {
    const ga = generalize(h.a, h.b);
    const gb = generalize(h.b, h.a);
    const candidates: HandPattern[] = [
      [ga, gb],
      [ga, exact(h.b)],
      [exact(h.a), gb],
    ];
    const p = normalize(candidates.find(covers) ?? [exact(h.a), exact(h.b)]);
    found.set(patternToString(p), p);
  }

  const list = [...found.values()];
  const within = (small: HandPattern, big: HandPattern) =>
    deck.every((a) => deck.every((b) => a === b || !matchesPattern(small, a, b) || matchesPattern(big, a, b)));
  return list
    .filter((p, i) => !list.some((q, j) => j !== i && within(p, q) && (!within(q, p) || j < i)))
    .sort((x, y) => (y[0].rank ?? -1) - (x[0].rank ?? -1) || (y[1].rank ?? -1) - (x[1].rank ?? -1));
}

export function nutLadder(board: readonly Card[], depth = 6): NutTier[] {
  const onBoard = new Set(board);
  const deck = fullDeck().filter((c) => !onBoard.has(c));
  const combos: Combo[] = [];
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) combos.push({ a: deck[i], b: deck[j], rank: evaluate([deck[i], deck[j], ...board]) });
  }
  const placed = new Set<number>();
  const isPlaced = (a: Card, b: Card) => placed.has(pairKey(a, b));
  const disjoint = (x: Combo, y: Combo) => x.a !== y.a && x.a !== y.b && x.b !== y.a && x.b !== y.b;

  const tiers: NutTier[] = [];
  let remaining = combos;
  while (remaining.length > 0 && (tiers.length < depth || tiers.every((t) => t.category === tiers[0].category))) {
    const eligible = remaining.filter((h) => !remaining.some((o) => o.rank > h.rank && disjoint(o, h)));
    const category = Math.max(...eligible.map((h) => categoryOf(h.rank))) as HandCategory;
    const tier = eligible.filter((h) => categoryOf(h.rank) === category);
    for (const h of tier) placed.add(pairKey(h.a, h.b));
    remaining = remaining.filter((h) => !placed.has(pairKey(h.a, h.b)));
    tiers.push({ category, patterns: tierPatterns(tier, deck, isPlaced) });
  }
  return tiers;
}

// Above the ceiling the result is only a lower bound: callers that need one category can stop early.
export function nutCategory(board: readonly Card[], ceiling: HandCategory = HandCategory.StraightFlush): HandCategory {
  const onBoard = new Set(board);
  const deck = fullDeck().filter((c) => !onBoard.has(c));
  let best = 0;
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      best = Math.max(best, evaluate([deck[i], deck[j], ...board]));
      if (categoryOf(best) > ceiling) return categoryOf(best);
    }
  }
  return categoryOf(best);
}
