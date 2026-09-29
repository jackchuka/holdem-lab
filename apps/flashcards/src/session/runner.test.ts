import { describe, expect, it } from 'vitest';
import { createRng } from '@holdem-lab/engine';
import type { GeneratorDeps, Question, Response } from '@holdem-lab/quiz';
import { RANGE_SETS_RAW, loadRangeSet } from '@holdem-lab/ranges';
import { createMemoryStore } from '../storage/store';
import { SessionRunner, type RunnerDeps } from './runner';

const now = Date.parse('2026-10-01T09:00:00Z');
const ranges = loadRangeSet(RANGE_SETS_RAW['6max-100bb-rfi']);

const makeDeps = (over: Partial<GeneratorDeps> = {}, newPerDay = 20): RunnerDeps => ({
  store: createMemoryStore(),
  generatorDeps: { equity: async () => 0.5, ranges, tolerance: 5, ...over },
  rng: createRng(1),
  now: () => now,
  newPerDay,
});

const rightAnswer = (q: Question): Response =>
  q.answer.kind === 'numeric' ? { value: q.answer.value, elapsedMs: 5000 } : { choiceIndex: q.answer.correct, elapsedMs: 5000 };
const wrongAnswer = (q: Question): Response =>
  q.answer.kind === 'numeric'
    ? { value: 0, elapsedMs: 5000 }
    : { choiceIndex: (q.answer.correct + 1) % q.choices!.length, elapsedMs: 5000 };

describe('SessionRunner', () => {
  it('serves questions, records history and schedules reviews', async () => {
    const deps = makeDeps();
    const runner = new SessionRunner(deps);
    await runner.start({ categories: ['potodds'], size: 3 });
    const q = (await runner.next())!;
    expect(q.category).toBe('potodds');
    expect(runner.progress).toEqual({ index: 1, total: 3 });
    const res = await runner.answer(rightAnswer(q));
    expect(res.correct).toBe(true);
    expect(await deps.store.getHistory(0)).toHaveLength(1);
    expect(await deps.store.getReviews()).toHaveLength(1);
  });

  it('rejects a second answer to the same question', async () => {
    const runner = new SessionRunner(makeDeps());
    await runner.start({ categories: ['range'], size: 2 });
    const q = (await runner.next())!;
    await runner.answer(rightAnswer(q));
    await expect(runner.answer(rightAnswer(q))).rejects.toThrow();
  });

  it('respects the daily new limit and does not schedule practice items', async () => {
    const deps = makeDeps({}, 2);
    const runner = new SessionRunner(deps);
    await runner.start({ categories: ['potodds'], size: 5 });
    for (let q = await runner.next(); q; q = await runner.next()) await runner.answer(rightAnswer(q));
    const history = await deps.store.getHistory(0);
    expect(history.map((h) => h.kind)).toEqual(['new', 'new', 'practice', 'practice', 'practice']);
    expect(await deps.store.getReviews()).toHaveLength(2);
  });

  it('inserts the odds follow-up after a correct outs answer', async () => {
    const runner = new SessionRunner(makeDeps());
    await runner.start({ categories: ['outs'], size: 1 });
    const q = (await runner.next())!;
    await runner.answer(rightAnswer(q));
    expect(runner.progress.total).toBe(2);
    const follow = (await runner.next())!;
    expect(follow.itemKey).toBe(q.followUp!.itemKey);
    expect(follow.stage.hero).toEqual(q.stage.hero);
  });

  it('skips the follow-up after a wrong outs answer', async () => {
    const runner = new SessionRunner(makeDeps());
    await runner.start({ categories: ['outs'], size: 1 });
    const q = (await runner.next())!;
    await runner.answer(wrongAnswer(q));
    expect(await runner.next()).toBeNull();
  });

  it('replaces a failed equity question with another category', async () => {
    const runner = new SessionRunner(makeDeps({ equity: () => Promise.reject(new Error('equity timeout')) }));
    await runner.start({ categories: ['equity', 'potodds'], size: 2 });
    const categories: string[] = [];
    for (let q = await runner.next(); q; q = await runner.next()) {
      categories.push(q.category);
      await runner.answer(rightAnswer(q));
    }
    expect(categories).toHaveLength(2);
    expect(categories.every((c) => c === 'potodds')).toBe(true);
  });

  it('ends the session when nothing can replace a failure', async () => {
    const runner = new SessionRunner(makeDeps({ equity: () => Promise.reject(new Error('equity timeout')) }));
    await runner.start({ categories: ['equity'], size: 2 });
    expect(await runner.next()).toBeNull();
    expect(runner.progress.total).toBe(0);
  });

  it('serves nothing for ranges when they failed to load', async () => {
    const runner = new SessionRunner(makeDeps({ ranges: null }));
    await runner.start({ categories: ['range'], size: 3 });
    expect(await runner.next()).toBeNull();
  });

  it('summarises results and lists weak items by key', async () => {
    const runner = new SessionRunner(makeDeps());
    await runner.start({ itemKeys: ['rfi:UTG:A9o', 'rfi:UTG:AA', 'rfi:UTG:A9o'] });
    for (let q = await runner.next(); q; q = await runner.next()) {
      await runner.answer(q.itemKey.endsWith('A9o') ? wrongAnswer(q) : rightAnswer(q));
    }
    const s = runner.summary();
    expect(s.total).toBe(3);
    expect(s.correct).toBe(1);
    expect(s.byCategory.range).toEqual({ total: 3, correct: 1 });
    expect(s.weak).toEqual([
      { itemKey: 'rfi:UTG:A9o', label: { key: 'label.rfi', params: { pos: 'UTG', hand: 'A9o' } }, misses: 2 },
    ]);
  });
});
