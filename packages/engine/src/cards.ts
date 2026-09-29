export type Card = number;
export type HandClass = string;

export const RANKS = '23456789TJQKA';
export const SUITS = 'shdc';
const GRID = 'AKQJT98765432';

export function rankOf(c: Card): number {
  return c >> 2;
}

export function suitOf(c: Card): number {
  return c & 3;
}

export function makeCard(rank: number, suit: number): Card {
  return rank * 4 + suit;
}

export function parseCard(s: string): Card {
  const r = s.length === 2 ? RANKS.indexOf(s[0]) : -1;
  const su = s.length === 2 ? SUITS.indexOf(s[1]) : -1;
  if (r < 0 || su < 0) throw new Error(`invalid card: ${s}`);
  return makeCard(r, su);
}

export function parseCards(s: string): Card[] {
  const t = s.replace(/\s+/g, '');
  if (t.length % 2 !== 0) throw new Error(`invalid cards: ${s}`);
  const out: Card[] = [];
  for (let i = 0; i < t.length; i += 2) out.push(parseCard(t.slice(i, i + 2)));
  return out;
}

export function cardToString(c: Card): string {
  return RANKS[rankOf(c)] + SUITS[suitOf(c)];
}

export function cardsToString(cs: readonly Card[]): string {
  return cs.map(cardToString).join('');
}

export function fullDeck(): Card[] {
  return Array.from({ length: 52 }, (_, i) => i);
}

export function handClassAt(row: number, col: number): HandClass {
  const a = GRID[row];
  const b = GRID[col];
  if (row === col) return a + b;
  return row < col ? `${a}${b}s` : `${b}${a}o`;
}

export const HAND_CLASSES: HandClass[] = Array.from({ length: 169 }, (_, i) =>
  handClassAt(Math.floor(i / 13), i % 13),
);

export function gridPosition(hc: HandClass): [number, number] {
  const hi = GRID.indexOf(hc[0]);
  const lo = GRID.indexOf(hc[1]);
  if (hc.length === 2) return [hi, hi];
  return hc[2] === 's' ? [hi, lo] : [lo, hi];
}

export function handClassOf(a: Card, b: Card): HandClass {
  const hi = Math.max(rankOf(a), rankOf(b));
  const lo = Math.min(rankOf(a), rankOf(b));
  if (hi === lo) return RANKS[hi] + RANKS[lo];
  return RANKS[hi] + RANKS[lo] + (suitOf(a) === suitOf(b) ? 's' : 'o');
}

export function combosOf(hc: HandClass): [Card, Card][] {
  const hi = RANKS.indexOf(hc[0]);
  const lo = RANKS.indexOf(hc[1]);
  const out: [Card, Card][] = [];
  for (let s1 = 0; s1 < 4; s1++) {
    for (let s2 = 0; s2 < 4; s2++) {
      if (hc.length === 2) {
        if (s1 < s2) out.push([makeCard(hi, s1), makeCard(lo, s2)]);
      } else if (hc[2] === 's' ? s1 === s2 : s1 !== s2) {
        out.push([makeCard(hi, s1), makeCard(lo, s2)]);
      }
    }
  }
  return out;
}

export function comboCount(hc: HandClass): number {
  if (hc.length === 2) return 6;
  return hc[2] === 's' ? 4 : 12;
}
