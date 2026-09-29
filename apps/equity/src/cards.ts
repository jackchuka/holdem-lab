import { RANKS, rankOf, suitOf, type Card } from '@holdem-lab/engine';

const GLYPHS = ['♠', '♥', '♦', '♣'];

export function cardLabel(c: Card): string {
  const r = RANKS[rankOf(c)];
  return `${r === 'T' ? '10' : r}${GLYPHS[suitOf(c)]}`;
}
