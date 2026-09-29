import { HAND_CLASSES, RANKS, combosOf, type Card, type HandClass } from '@holdem-lab/engine';
import { text, type Text } from '../i18n/text';
import type { Generator } from '../types';

const parse = (hc: HandClass) => ({
  hi: RANKS.indexOf(hc[0]),
  lo: RANKS.indexOf(hc[1]),
  pair: hc.length === 2,
});

export function matchupHint(a: HandClass, b: HandClass): Text {
  const A = parse(a);
  const B = parse(b);
  if (A.pair && B.pair) return text('hint.pairVsPair');
  if (A.pair !== B.pair) {
    const p = A.pair ? A : B;
    const n = A.pair ? B : A;
    const over = [n.hi, n.lo].filter((r) => r > p.hi).length;
    if (over === 2) return text('hint.pairVsTwoOver');
    if (over === 1) return text('hint.pairVsOneOver');
    return text('hint.pairVsUnder');
  }
  if ([A.hi, A.lo].some((r) => r === B.hi || r === B.lo)) return text('hint.dominated');
  if (A.lo > B.hi || B.lo > A.hi) return text('hint.overUnder');
  return text('hint.interleaved');
}

function parseKey(itemKey: string): [HandClass, HandClass] {
  const m = /^eq:(.+)-vs-(.+)$/.exec(itemKey);
  if (!m || !HAND_CLASSES.includes(m[1]) || !HAND_CLASSES.includes(m[2]) || m[1] === m[2]) {
    throw new Error(`invalid equity key: ${itemKey}`);
  }
  return [m[1], m[2]];
}

export const equityGenerator: Generator = {
  category: 'equity',

  randomItemKey(rng, _deps, exclude) {
    for (let i = 0; i < 200; i++) {
      const a = rng.pick(HAND_CLASSES);
      const b = rng.pick(HAND_CLASSES);
      if (a === b) continue;
      const key = `eq:${a}-vs-${b}`;
      if (!exclude?.has(key)) return key;
    }
    return null;
  },

  async generate(itemKey, rng, deps) {
    const [a, b] = parseKey(itemKey);
    const hero: Card[] = rng.pick(combosOf(a));
    const villain: Card[] = rng.pick(combosOf(b).filter(([x, y]) => !hero.includes(x) && !hero.includes(y)));
    const pct = Math.round((await deps.equity(hero, villain, [])) * 1000) / 10;
    const lines = [text('equity.approx', { a, b, pct: Math.round(pct) }), matchupHint(a, b)];
    if (a.endsWith('s') || b.endsWith('s')) lines.push(text('hint.suited'));
    return {
      itemKey,
      category: 'equity',
      stage: { context: { kind: 'villain', cards: villain }, board: [], hero },
      prompt: text('equity.prompt'),
      answer: { kind: 'numeric', value: pct, tolerance: deps.tolerance },
      explanation: { headline: text('value', { value: `${pct.toFixed(1)}%` }), lines },
    };
  },

  universeSize: () => HAND_CLASSES.length * (HAND_CLASSES.length - 1),
};
