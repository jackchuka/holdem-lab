import { HAND_CLASSES, combosOf, fullDeck, multiEquity, summarize, type WeightedCombo } from '@holdem-lab/engine';
import { describe, expect, it } from 'vitest';
import { PREFLOP_EQUITY } from './preflopEquity';

const deck = fullDeck();
const RANDOM: WeightedCombo[] = [];
for (let i = 0; i < 52; i++) for (let j = i + 1; j < 52; j++) RANDOM.push({ combo: [deck[i], deck[j]], weight: 1 });
const engineEquity = (hc: string) =>
  summarize(
    multiEquity(
      [
        { kind: 'hand', cards: combosOf(hc)[0] },
        { kind: 'range', combos: RANDOM },
      ],
      [],
      { mode: 'mc', iterations: 20_000, seed: 7 },
    ),
  ).equity[0];

describe('PREFLOP_EQUITY', () => {
  it('covers all 169 hand classes with values in 0..1', () => {
    expect(Object.keys(PREFLOP_EQUITY).sort()).toEqual([...HAND_CLASSES].sort());
    for (const v of Object.values(PREFLOP_EQUITY)) expect(v > 0 && v < 1).toBe(true);
  });

  it.each(['AA', '72o', 'AKs'])('matches the engine for %s', (hc) => {
    expect(Math.abs(PREFLOP_EQUITY[hc] - engineEquity(hc))).toBeLessThan(0.015);
  });

  it('ranks AA highest', () => {
    expect(Math.max(...Object.values(PREFLOP_EQUITY))).toBe(PREFLOP_EQUITY.AA);
  });
});
