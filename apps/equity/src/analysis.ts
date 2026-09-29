import { HAND_CLASSES, type Card, type EquityStats, type HandClass } from '@holdem-lab/engine';

export const FADE_RATIO = 0.005;

export function heatColor(delta: number, span: number): string {
  const pct = Math.round(Math.min(1, Math.abs(delta) / span) * 100);
  return `color-mix(in srgb, var(${delta < 0 ? '--heat-neg' : '--heat-pos'}) ${pct}%, var(--heat-mid))`;
}

export type CardCell = { card: Card; equity: number; delta: number; faded: boolean };

export function nextCardCells(stats: EquityStats, focus: number): CardCell[] {
  const nc = stats.nextCard;
  if (!nc || !stats.samples) return [];
  const base = stats.share[focus] / stats.samples;
  const out: CardCell[] = [];
  for (let card = 0; card < 52; card++) {
    const n = nc.samples[card];
    if (!n) continue;
    const equity = nc.share[card] / n;
    out.push({ card, equity, delta: equity - base, faded: n < FADE_RATIO * stats.samples });
  }
  return out;
}

export function nextCardSummary(cells: CardCell[]) {
  if (!cells.length) return null;
  const sorted = [...cells].sort((a, b) => a.delta - b.delta);
  return { worst: sorted[0], best: sorted.at(-1)!, down: cells.filter((c) => c.delta < 0).length, total: cells.length };
}

export type ClassCell = { equity: number; weight: number; faded: boolean };

export function classCells(stats: EquityStats): Map<HandClass, ClassCell> {
  const out = new Map<HandClass, ClassCell>();
  const bc = stats.byClass;
  if (!bc) return out;
  HAND_CLASSES.forEach((hc, i) => {
    const n = bc.samples[i];
    if (n) out.set(hc, { equity: bc.share[i] / n, weight: n, faded: n < FADE_RATIO * stats.samples });
  });
  return out;
}
