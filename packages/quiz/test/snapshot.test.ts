import { describe, expect, it } from 'vitest';
import { cardsToString, createRng } from '@holdem-lab/engine';
import { RANGE_SETS_RAW, loadRangeSet } from '@holdem-lab/ranges';
import { CATEGORIES, GENERATORS, generateQuestion, type GeneratorDeps, type Question } from '../src';

const deps: GeneratorDeps = {
  equity: async () => 0.462,
  ranges: loadRangeSet(RANGE_SETS_RAW['6max-100bb-rfi']),
  tolerance: 5,
};

const readable = (q: Question) => ({
  ...q,
  stage: {
    ...q.stage,
    board: cardsToString(q.stage.board),
    hero: cardsToString(q.stage.hero),
    context: q.stage.context.kind === 'villain' ? { ...q.stage.context, cards: cardsToString(q.stage.context.cards) } : q.stage.context,
  },
});

describe('question snapshots', () => {
  it.each(CATEGORIES)('%s question is stable for a fixed seed', async (category) => {
    const rng = createRng(20260929);
    const key = GENERATORS[category].randomItemKey(rng, deps)!;
    expect(readable(await generateQuestion(key, rng, deps))).toMatchSnapshot();
  });
});
