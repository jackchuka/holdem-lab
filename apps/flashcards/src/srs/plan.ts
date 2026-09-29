import type { Category, Question } from '@holdem-lab/quiz';
import type { ItemKind, ReviewRecord } from '../types';

export type PlanItem = {
  itemKey: string;
  category: Category;
  kind: ItemKind;
  question?: Question;
  replacement?: boolean;
};

export type PlanInput = {
  categories: Category[];
  size: number;
  now: number;
  reviews: ReviewRecord[];
  newRemaining: number;
  pickNew: (category: Category, exclude: ReadonlySet<string>) => string | null;
  pickAny: (category: Category) => string | null;
};

export function buildPlan(input: PlanInput): PlanItem[] {
  const { categories, size, now, reviews } = input;
  if (!categories.length) return [];
  const selected = new Set(categories);
  const plan: PlanItem[] = reviews
    .filter((r) => selected.has(r.category) && r.due <= now)
    .sort((a, b) => a.due - b.due)
    .slice(0, size)
    .map((r) => ({ itemKey: r.itemKey, category: r.category, kind: 'review' }));

  const seen = new Set(reviews.map((r) => r.itemKey));
  let turn = 0;
  let misses = 0;
  let added = 0;
  while (plan.length < size && added < input.newRemaining && misses < categories.length) {
    const category = categories[turn++ % categories.length];
    const key = input.pickNew(category, seen);
    if (!key) {
      misses++;
      continue;
    }
    misses = 0;
    seen.add(key);
    plan.push({ itemKey: key, category, kind: 'new' });
    added++;
  }

  misses = 0;
  while (plan.length < size && misses < categories.length) {
    const category = categories[turn++ % categories.length];
    const key = input.pickAny(category);
    if (!key) {
      misses++;
      continue;
    }
    misses = 0;
    plan.push({ itemKey: key, category, kind: 'practice' });
  }
  return plan;
}
