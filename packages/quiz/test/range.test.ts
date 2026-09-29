import { describe, expect, it } from 'vitest';
import { HAND_CLASSES, createRng, handClassOf } from '@holdem-lab/engine';
import { POSITIONS, RANGE_SETS_RAW, isBoundary, loadRangeSet, type Position } from '@holdem-lab/ranges';
import { gradeResponse, rangeGenerator, renderText, type GeneratorDeps } from '../src';

const ranges = loadRangeSet(RANGE_SETS_RAW['6max-100bb-rfi']);
const deps: GeneratorDeps = { equity: async () => 0.5, ranges, tolerance: 5 };

describe('rangeGenerator', () => {
  it('asks raise or fold for a position and hand', async () => {
    const q = await rangeGenerator.generate('rfi:UTG:A9o', createRng(1), deps);
    expect(handClassOf(q.stage.hero[0], q.stage.hero[1])).toBe('A9o');
    expect(q.stage.context).toEqual({ kind: 'position', position: 'UTG' });
    expect(q.choices!.map((c) => c.label)).toEqual(['Fold', 'Raise']);
    expect(q.answer).toEqual({ kind: 'choice', correct: 0 });
    expect(q.explanation.grid?.highlight).toBe('A9o');
    expect(renderText(q.prompt, 'en')).toBe('Folded to you. Open from UTG?');
    const aa = await rangeGenerator.generate('rfi:UTG:AA', createRng(1), deps);
    expect(aa.answer).toEqual({ kind: 'choice', correct: 1 });
  });

  it('accepts both actions for 50/50 hands', async () => {
    const q = await rangeGenerator.generate('rfi:UTG:44', createRng(1), deps);
    expect(q.answer).toEqual({ kind: 'choice', correct: 1, alsoCorrect: [0] });
    expect(q.explanation.headline).toEqual({ key: 'value', params: { value: 'Raise / Fold' } });
    for (const choiceIndex of [0, 1]) expect(gradeResponse(q, { choiceIndex, elapsedMs: 1000 }).correct).toBe(true);
  });

  it('prefers boundary hands', () => {
    const rng = createRng(9);
    const isB = (k: string) => {
      const [, pos, hc] = k.split(':');
      return isBoundary(ranges.spots[pos as Position], hc);
    };
    const keys = Array.from({ length: 2000 }, () => rangeGenerator.randomItemKey(rng, deps)!);
    const share = keys.filter(isB).length / keys.length;
    const universe = POSITIONS.flatMap((p) => HAND_CLASSES.map((hc) => `rfi:${p}:${hc}`));
    const base = universe.filter(isB).length / universe.length;
    expect(share).toBeGreaterThan(base * 1.3);
  });

  it('is unavailable without ranges', async () => {
    const none = { ...deps, ranges: null };
    expect(rangeGenerator.randomItemKey(createRng(1), none)).toBeNull();
    expect(rangeGenerator.universeSize(none)).toBe(0);
    await expect(rangeGenerator.generate('rfi:UTG:AA', createRng(1), none)).rejects.toThrow();
  });
});
