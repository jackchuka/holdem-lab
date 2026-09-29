import { rankOf, suitOf, type Card } from './cards';
import { straightHigh } from './evaluator';

export type DrawFeatures = {
  flushDraw: boolean;
  straightDraw: 'oesd' | 'gutshot' | null;
  overcards: boolean;
};

const rankMask = (cards: readonly Card[]) => cards.reduce((m, c) => m | (1 << rankOf(c)), 0);

export function drawFeatures(hero: readonly Card[], board: readonly Card[]): DrawFeatures {
  const all = [...hero, ...board];
  let flushDraw = false;
  for (let s = 0; s < 4; s++) {
    const total = all.filter((c) => suitOf(c) === s).length;
    if (total === 4 && hero.some((c) => suitOf(c) === s)) flushDraw = true;
  }

  const allMask = rankMask(all);
  const boardMask = rankMask(board);
  let completing = 0;
  if (straightHigh(allMask) < 0) {
    for (let r = 0; r < 13; r++) {
      const bit = 1 << r;
      if (straightHigh(allMask | bit) >= 0 && straightHigh(boardMask | bit) < 0) completing++;
    }
  }
  const straightDraw = completing >= 2 ? 'oesd' : completing === 1 ? 'gutshot' : null;

  const boardMax = Math.max(...board.map(rankOf));
  const [a, b] = hero.map(rankOf);
  const overcards = a !== b && Math.min(a, b) > boardMax;

  return { flushDraw, straightDraw, overcards };
}

export function drawKey(f: DrawFeatures): string | null {
  if (f.flushDraw && f.straightDraw) return `flush-draw+${f.straightDraw}`;
  if (f.flushDraw && f.overcards) return 'flush-draw+overcards';
  if (f.flushDraw) return 'flush-draw';
  if (f.straightDraw) return f.straightDraw;
  if (f.overcards) return 'overcards';
  return null;
}
