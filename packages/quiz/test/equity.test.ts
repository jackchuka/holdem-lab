import { describe, expect, it } from 'vitest';
import { cardsToString, createRng, handClassOf } from '@holdem-lab/engine';
import { equityGenerator, matchupHint, renderText, type GeneratorDeps } from '../src';

const deps: GeneratorDeps = { equity: async () => 0.462, ranges: null, tolerance: 5 };

describe('equityGenerator', () => {
  it('builds a numeric question from the item key', async () => {
    const q = await equityGenerator.generate('eq:AKs-vs-QQ', createRng(1), deps);
    expect(q.category).toBe('equity');
    expect(handClassOf(q.stage.hero[0], q.stage.hero[1])).toBe('AKs');
    if (q.stage.context.kind !== 'villain') throw new Error();
    expect(handClassOf(q.stage.context.cards[0], q.stage.context.cards[1])).toBe('QQ');
    expect(q.stage.board).toEqual([]);
    expect(q.answer).toEqual({ kind: 'numeric', value: 46.2, tolerance: 5 });
    expect(renderText(q.explanation.headline, 'ja')).toBe('46.2%');
    expect(renderText(q.prompt, 'en')).toBe('All in. What is your equity?');
  });

  it('never deals the same card twice', async () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = await equityGenerator.generate('eq:AKs-vs-AKo', createRng(seed), deps);
      if (q.stage.context.kind !== 'villain') throw new Error();
      const all = [...q.stage.hero, ...q.stage.context.cards];
      expect(new Set(all).size, cardsToString(all)).toBe(4);
    }
  });

  it('picks keys outside the exclude set', () => {
    const rng = createRng(3);
    const first = equityGenerator.randomItemKey(rng, deps)!;
    expect(first).toMatch(/^eq:[2-9TJQKA]{2}[so]?-vs-[2-9TJQKA]{2}[so]?$/);
    expect(equityGenerator.randomItemKey(rng, deps, new Set([first]))).not.toBe(first);
  });

  it('explains common matchups', () => {
    expect(matchupHint('QQ', 'AKs').key).toBe('hint.pairVsTwoOver');
    expect(matchupHint('AA', 'KK').key).toBe('hint.pairVsPair');
    expect(matchupHint('AKo', 'AQo').key).toBe('hint.dominated');
    expect(matchupHint('AKo', '76s').key).toBe('hint.overUnder');
    expect(matchupHint('AJo', 'KQo').key).toBe('hint.interleaved');
  });
});
