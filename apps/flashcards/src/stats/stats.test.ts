import { describe, expect, it } from 'vitest';
import { State } from 'ts-fsrs';
import { applyReview } from '../srs/schedule';
import { DAY_MS } from '../time';
import type { HistoryEntry } from '../types';
import { accuracyByCategory, computeStreak, dailyCounts, masteryCounts } from './stats';

const now = new Date(2026, 9, 10, 12).getTime();
const at = (daysAgo: number, correct = true, category: HistoryEntry['category'] = 'outs'): HistoryEntry => ({
  itemKey: 'k',
  category,
  kind: 'review',
  correct,
  elapsedMs: 1000,
  at: now - daysAgo * DAY_MS,
});

describe('stats', () => {
  it('counts consecutive study days', () => {
    expect(computeStreak([at(0), at(1), at(2), at(4)], now)).toBe(3);
    expect(computeStreak([at(1), at(2)], now)).toBe(2);
    expect(computeStreak([at(2)], now)).toBe(0);
    expect(computeStreak([], now)).toBe(0);
  });

  it('buckets answers per day', () => {
    const counts = dailyCounts([at(0), at(0), at(29), at(30)], now, 30);
    expect(counts).toHaveLength(30);
    expect(counts[29]).toBe(2);
    expect(counts[0]).toBe(1);
  });

  it('computes accuracy per category', () => {
    const acc = accuracyByCategory([at(0, true), at(0, false), at(0, true, 'range')]);
    expect(acc.outs).toEqual({ total: 2, correct: 1 });
    expect(acc.range).toEqual({ total: 1, correct: 1 });
    expect(acc.equity).toEqual({ total: 0, correct: 0 });
  });

  it('splits reviews into mastery buckets', () => {
    const fresh = applyReview(undefined, 'a', 'outs', 'good', new Date(now));
    const strong = { ...fresh, itemKey: 'b', card: { ...fresh.card, state: State.Review, stability: 30 } };
    expect(masteryCounts([fresh, strong], 10)).toEqual({ mastered: 1, learning: 1, unlearned: 8 });
  });
});
