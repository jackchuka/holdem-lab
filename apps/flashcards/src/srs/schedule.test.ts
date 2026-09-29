import { describe, expect, it } from 'vitest';
import { applyReview } from './schedule';

const now = new Date('2026-10-01T09:00:00Z');

describe('applyReview', () => {
  it('creates a record for a new item', () => {
    const r = applyReview(undefined, 'po:bet-50', 'potodds', 'good', now);
    expect(r.itemKey).toBe('po:bet-50');
    expect(r.category).toBe('potodds');
    expect(r.due).toBe(r.card.due.getTime());
    expect(r.due).toBeGreaterThan(now.getTime());
  });

  it('schedules easy answers further out than failed ones', () => {
    const easy = applyReview(undefined, 'k', 'outs', 'easy', now);
    const again = applyReview(undefined, 'k', 'outs', 'again', now);
    expect(easy.due).toBeGreaterThan(again.due);
  });

  it('builds on the previous card', () => {
    const first = applyReview(undefined, 'k', 'outs', 'good', now);
    const second = applyReview(first, 'k', 'outs', 'good', new Date(first.due));
    expect(second.card.reps).toBe(2);
  });
});
