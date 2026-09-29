import { HAND_CLASSES, combosOf } from '@holdem-lab/engine';
import { POSITIONS, actionOf, isBoundary, rfiPercent, type Position } from '@holdem-lab/ranges';
import { text } from '../i18n/text';
import type { Generator } from '../types';

const parseKey = (itemKey: string) => {
  const m = /^rfi:([A-Z]+):(.+)$/.exec(itemKey);
  if (!m || !(POSITIONS as readonly string[]).includes(m[1]) || !HAND_CLASSES.includes(m[2])) {
    throw new Error(`invalid range key: ${itemKey}`);
  }
  return { position: m[1] as Position, hand: m[2] };
};

export const rangeGenerator: Generator = {
  category: 'range',

  randomItemKey(rng, deps, exclude) {
    const ranges = deps.ranges;
    if (!ranges) return null;
    const weighted: { key: string; w: number }[] = [];
    for (const pos of POSITIONS) {
      for (const hc of HAND_CLASSES) {
        const key = `rfi:${pos}:${hc}`;
        if (!exclude?.has(key)) weighted.push({ key, w: isBoundary(ranges.spots[pos], hc) ? 3 : 1 });
      }
    }
    if (!weighted.length) return null;
    let x = rng.next() * weighted.reduce((n, e) => n + e.w, 0);
    for (const e of weighted) {
      x -= e.w;
      if (x < 0) return e.key;
    }
    return weighted[weighted.length - 1].key;
  },

  async generate(itemKey, rng, deps) {
    const { position, hand } = parseKey(itemKey);
    if (!deps.ranges) throw new Error('range set is not loaded');
    const spot = deps.ranges.spots[position];
    const action = actionOf(spot, hand);
    const freq = spot[hand].raise;
    const fifty = freq === 0.5;
    const detail =
      freq > 0 && freq < 1
        ? text('range.mixed', { hand, pct: Math.round(freq * 100) })
        : text(action === 'raise' ? 'range.in' : 'range.out', { hand });
    return {
      itemKey,
      category: 'range',
      stage: { context: { kind: 'position', position }, board: [], hero: rng.pick(combosOf(hand)) },
      prompt: text('range.prompt', { pos: position }),
      answer: fifty ? { kind: 'choice', correct: 1, alsoCorrect: [0] } : { kind: 'choice', correct: action === 'raise' ? 1 : 0 },
      choices: [{ label: 'Fold' }, { label: 'Raise' }],
      explanation: {
        headline: text('value', { value: fifty ? 'Raise / Fold' : action === 'raise' ? 'Raise' : 'Fold' }),
        lines: [text('range.summary', { pos: position, pct: Math.round(rfiPercent(spot)) }), detail],
        grid: {
          raise: Object.fromEntries(HAND_CLASSES.map((hc) => [hc, spot[hc].raise])),
          highlight: hand,
        },
      },
    };
  },

  universeSize: (deps) => (deps.ranges ? POSITIONS.length * HAND_CLASSES.length : 0),
};
