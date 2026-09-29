import { HAND_CLASSES, RANKS, comboCount, combosOf, type HandClass, type WeightedCombo } from '@holdem-lab/engine';
import { expandNotation } from './notation';
import type { Spot } from './rangeSet';

export type WeightedRange = Map<HandClass, number>;
export type RangeParseError = { start: number; end: number; token: string };

export function parseRange(text: string): { range: WeightedRange; errors: RangeParseError[] } {
  const range: WeightedRange = new Map();
  const errors: RangeParseError[] = [];
  const re = /[^,]+/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const token = m[0].trim();
    if (!token) continue;
    const start = m.index + m[0].indexOf(token);
    const parts = token.split(':');
    const weight = parts.length === 2 ? Number(parts[1]) : 1;
    try {
      if (parts.length > 2 || parts[1]?.trim() === '' || !Number.isFinite(weight) || weight < 0 || weight > 1) {
        throw new Error(token);
      }
      for (const hc of expandNotation(parts[0])) {
        if (weight > 0) range.set(hc, weight);
        else range.delete(hc);
      }
    } catch {
      errors.push({ start, end: start + token.length, token });
    }
  }
  return { range, errors };
}

const r = (i: number) => RANKS[i];

function runs(ranks: number[]): number[][] {
  const out: number[][] = [];
  for (const x of ranks) {
    const last = out.at(-1);
    if (last && last.at(-1) === x + 1) last.push(x);
    else out.push([x]);
  }
  return out;
}

function tokensFor(classes: Set<HandClass>): string[] {
  const out: string[] = [];
  const pairs = Array.from({ length: 13 }, (_, i) => i).reverse().filter((i) => classes.has(r(i) + r(i)));
  for (const run of runs(pairs)) {
    const [hi, lo] = [run[0], run.at(-1)!];
    if (hi === 12 && run.length > 1) out.push(`${r(lo)}${r(lo)}+`);
    else if (run.length > 1) out.push(`${r(hi)}${r(hi)}-${r(lo)}${r(lo)}`);
    else out.push(r(hi) + r(hi));
  }
  for (const suit of ['s', 'o']) {
    for (let hi = 12; hi > 0; hi--) {
      const kickers = Array.from({ length: hi }, (_, i) => i).reverse().filter((lo) => classes.has(`${r(hi)}${r(lo)}${suit}`));
      for (const run of runs(kickers)) {
        const [top, bottom] = [run[0], run.at(-1)!];
        if (top === hi - 1 && run.length > 1) out.push(`${r(hi)}${r(bottom)}${suit}+`);
        else if (run.length > 1) out.push(`${r(hi)}${r(top)}${suit}-${r(hi)}${r(bottom)}${suit}`);
        else out.push(`${r(hi)}${r(top)}${suit}`);
      }
    }
  }
  return out;
}

export function formatRange(range: ReadonlyMap<HandClass, number>): string {
  const byWeight = new Map<number, Set<HandClass>>();
  for (const [hc, w] of range) {
    if (w <= 0) continue;
    if (!byWeight.has(w)) byWeight.set(w, new Set());
    byWeight.get(w)!.add(hc);
  }
  const weights = [...byWeight.keys()].sort((a, b) => b - a);
  return weights
    .flatMap((w) => {
      const suffix = w === 1 ? '' : `:${Math.round(w * 1000) / 1000}`;
      return tokensFor(byWeight.get(w)!).map((t) => t + suffix);
    })
    .join(', ');
}

export function rangeToCombos(range: ReadonlyMap<HandClass, number>): WeightedCombo[] {
  const out: WeightedCombo[] = [];
  for (const [hc, weight] of range) {
    if (weight > 0) for (const combo of combosOf(hc)) out.push({ combo, weight });
  }
  return out;
}

export function rangeFromSpot(spot: Spot): WeightedRange {
  return new Map(HAND_CLASSES.filter((hc) => spot[hc].raise > 0).map((hc) => [hc, spot[hc].raise]));
}

export function comboStats(range: ReadonlyMap<HandClass, number>): { combos: number; percent: number } {
  let combos = 0;
  for (const [hc, w] of range) combos += w * comboCount(hc);
  return { combos, percent: (combos / 1326) * 100 };
}

export function fullRange(): WeightedRange {
  return new Map(HAND_CLASSES.map((hc) => [hc, 1]));
}

export function sameRange(a: ReadonlyMap<HandClass, number>, b: ReadonlyMap<HandClass, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [hc, w] of a) if (b.get(hc) !== w) return false;
  return true;
}
