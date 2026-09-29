import { describe, expect, it } from 'vitest';
import type { Category } from '@holdem-lab/quiz';
import { createEmptyCard } from 'ts-fsrs';
import type { ReviewRecord } from '../types';
import { buildPlan } from './plan';

const now = Date.parse('2026-10-01T09:00:00Z');
const review = (itemKey: string, category: Category, due: number): ReviewRecord => ({
  itemKey,
  category,
  due,
  card: createEmptyCard(new Date(due)),
});

describe('buildPlan', () => {
  it('puts due reviews first, oldest first', () => {
    const plan = buildPlan({
      categories: ['outs'],
      size: 3,
      now,
      reviews: [review('outs:b', 'outs', now - 10), review('outs:a', 'outs', now - 100), review('outs:c', 'outs', now + 1000)],
      newRemaining: 0,
      pickNew: () => null,
      pickAny: () => 'outs:any',
    });
    expect(plan.map((p) => [p.itemKey, p.kind])).toEqual([
      ['outs:a', 'review'],
      ['outs:b', 'review'],
      ['outs:any', 'practice'],
    ]);
  });

  it('respects the new item limit and fills with practice', () => {
    let n = 0;
    const plan = buildPlan({
      categories: ['potodds'],
      size: 5,
      now,
      reviews: [],
      newRemaining: 2,
      pickNew: () => `po:new-${n++}`,
      pickAny: () => 'po:bet-50',
    });
    expect(plan.map((p) => p.kind)).toEqual(['new', 'new', 'practice', 'practice', 'practice']);
  });

  it('rotates new items across categories and skips exhausted ones', () => {
    const plan = buildPlan({
      categories: ['equity', 'range'],
      size: 4,
      now,
      reviews: [],
      newRemaining: 4,
      pickNew: (c, exclude) => (c === 'range' ? null : `eq:${exclude.size}`),
      pickAny: () => null,
    });
    expect(plan.map((p) => p.category)).toEqual(['equity', 'equity', 'equity', 'equity']);
    expect(new Set(plan.map((p) => p.itemKey)).size).toBe(4);
  });

  it('ignores reviews from unselected categories', () => {
    const plan = buildPlan({
      categories: ['outs'],
      size: 2,
      now,
      reviews: [review('eq:AA-vs-KK', 'equity', now - 1)],
      newRemaining: 0,
      pickNew: () => null,
      pickAny: () => null,
    });
    expect(plan).toEqual([]);
  });
});
