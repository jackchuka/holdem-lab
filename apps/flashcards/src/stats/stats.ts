import { CATEGORIES, type Category } from '@holdem-lab/quiz';
import { State } from 'ts-fsrs';
import { DAY_MS, startOfDay } from '../time';
import type { HistoryEntry, ReviewRecord } from '../types';

export function computeStreak(history: HistoryEntry[], now: number): number {
  const days = new Set(history.map((h) => startOfDay(h.at)));
  let day = startOfDay(now);
  if (!days.has(day)) day = startOfDay(day - DAY_MS / 2);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = startOfDay(day - DAY_MS / 2);
  }
  return streak;
}

export function dailyCounts(history: HistoryEntry[], now: number, days = 30): number[] {
  const counts = new Array<number>(days).fill(0);
  const today = startOfDay(now);
  for (const h of history) {
    const ago = Math.round((today - startOfDay(h.at)) / DAY_MS);
    if (ago >= 0 && ago < days) counts[days - 1 - ago]++;
  }
  return counts;
}

export function accuracyByCategory(history: HistoryEntry[]): Record<Category, { total: number; correct: number }> {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c, { total: 0, correct: 0 }])) as Record<
    Category,
    { total: number; correct: number }
  >;
  for (const h of history) {
    out[h.category].total++;
    if (h.correct) out[h.category].correct++;
  }
  return out;
}

const isMastered = (r: ReviewRecord) => r.card.state === State.Review && r.card.stability >= 21;

export function masteryCounts(reviews: ReviewRecord[], universe: number) {
  const mastered = reviews.filter(isMastered).length;
  return {
    mastered,
    learning: reviews.length - mastered,
    unlearned: Math.max(0, universe - reviews.length),
  };
}
