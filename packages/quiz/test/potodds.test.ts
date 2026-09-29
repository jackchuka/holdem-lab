import { describe, expect, it } from 'vitest';
import { createRng } from '@holdem-lab/engine';
import { POT_ODDS_KEYS, potOddsGenerator, type GeneratorDeps } from '../src';

const deps: GeneratorDeps = { equity: async () => 0.5, ranges: null, tolerance: 5 };

describe('potOddsGenerator', () => {
  it('computes the required equity', async () => {
    const q = await potOddsGenerator.generate('po:bet-75', createRng(2), deps);
    if (q.stage.context.kind !== 'pot' || q.answer.kind !== 'choice') throw new Error();
    const { pot, bet } = q.stage.context;
    expect(q.choices![q.answer.correct].label).toBe(`${Math.round((bet / (pot + 2 * bet)) * 100)}%`);
    expect(q.stage.board).toHaveLength(4);
    expect(q.stage.hero).toHaveLength(2);
    expect(['potodds.call', 'potodds.fold']).toContain(q.explanation.lines[2].key);
  });

  it('computes MDF', async () => {
    const q = await potOddsGenerator.generate('mdf:bet-50', createRng(2), deps);
    if (q.stage.context.kind !== 'pot' || q.answer.kind !== 'choice') throw new Error();
    const { pot, bet } = q.stage.context;
    expect(q.choices![q.answer.correct].label).toBe(`${Math.round((pot / (pot + bet)) * 100)}%`);
  });

  it('labels common mistakes', async () => {
    const q = await potOddsGenerator.generate('po:bet-75', createRng(2), deps);
    expect(q.choices!.some((c) => c.mistake?.key === 'mistake.betOverPotPlusBet')).toBe(true);
  });

  it('has 14 keys', () => {
    expect(POT_ODDS_KEYS).toHaveLength(14);
  });
});
