import { describe, expect, it } from 'vitest';
import { createRng, drawFeatures, drawKey, outs } from '@holdem-lab/engine';
import { OUTS_KEYS, outsGenerator, renderText, type GeneratorDeps } from '../src';

const deps: GeneratorDeps = { equity: async () => 0.5, ranges: null, tolerance: 5 };

describe('outsGenerator', () => {
  it('generates every draw type', async () => {
    for (const key of OUTS_KEYS) {
      const q = await outsGenerator.generate(key, createRng(11), deps);
      expect(q.itemKey).toBe(key);
      expect(q.stage.board).toHaveLength(3);
      expect(`outs:${drawKey(drawFeatures(q.stage.hero, q.stage.board))}`).toBe(key);
      if (q.stage.context.kind !== 'villain' || q.answer.kind !== 'choice') throw new Error();
      const o = outs(q.stage.hero, q.stage.context.cards, q.stage.board);
      expect(q.choices![q.answer.correct].label).toBe(String(o.count));
      expect(q.followUp?.itemKey).toBe(`odds:${o.count}`);
      expect(q.stage.context.label?.key).toMatch(/^hand\.\d$/);
    }
  });

  it('generates odds questions for a given out count', async () => {
    const q = await outsGenerator.generate('odds:9', createRng(5), deps);
    if (q.stage.context.kind !== 'villain' || q.answer.kind !== 'choice') throw new Error();
    expect(outs(q.stage.hero, q.stage.context.cards, q.stage.board).count).toBe(9);
    expect(q.choices![q.answer.correct].label).toBe('35%');
    expect(renderText(q.prompt, 'ja')).toBe('9アウツ。リバーまでに引ける確率は？');
  });

  it('only offers outs keys as new items', () => {
    expect(outsGenerator.randomItemKey(createRng(1), deps, new Set(OUTS_KEYS.slice(1)))).toBe(OUTS_KEYS[0]);
    expect(outsGenerator.randomItemKey(createRng(1), deps, new Set(OUTS_KEYS))).toBeNull();
  });
});
