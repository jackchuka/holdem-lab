import type { Rng } from '@holdem-lab/engine';
import {
  GENERATORS,
  categoryOfKey,
  generateQuestion,
  gradeResponse,
  labelOfKey,
  type Category,
  type GeneratorDeps,
  type GradeResult,
  type Question,
  type Response,
  type Text,
} from '@holdem-lab/quiz';
import { buildPlan, type PlanItem } from '../srs/plan';
import { applyReview } from '../srs/schedule';
import type { Store } from '../storage/store';
import { startOfDay } from '../time';
import type { ReviewRecord } from '../types';

export type SessionOptions = { categories: Category[]; size: number } | { itemKeys: string[] };
export type AnswerResult = GradeResult & { question: Question; response: Response };
export type SessionSummary = {
  total: number;
  correct: number;
  durationMs: number;
  byCategory: Partial<Record<Category, { total: number; correct: number }>>;
  weak: { itemKey: string; label: Text; misses: number }[];
};
export type RunnerDeps = {
  store: Store;
  generatorDeps: GeneratorDeps;
  rng: Rng;
  now: () => number;
  newPerDay: number;
};

export class SessionRunner {
  private queue: PlanItem[] = [];
  private categories: Category[] = [];
  private reviews = new Map<string, ReviewRecord>();
  private results: { item: PlanItem; grade: GradeResult }[] = [];
  private current: { item: PlanItem; question: Question } | null = null;
  private served = 0;
  private total = 0;
  private startedAt = 0;

  constructor(private deps: RunnerDeps) {}

  async start(opts: SessionOptions): Promise<void> {
    const { store, generatorDeps, rng, now } = this.deps;
    this.startedAt = now();
    const reviews = await store.getReviews();
    this.reviews = new Map(reviews.map((r) => [r.itemKey, r]));
    if ('itemKeys' in opts) {
      this.queue = opts.itemKeys.map((k) => ({ itemKey: k, category: categoryOfKey(k), kind: 'practice' }));
      this.categories = [...new Set(this.queue.map((i) => i.category))];
    } else {
      this.categories = opts.categories;
      const today = await store.getHistory(startOfDay(this.startedAt));
      const newToday = today.filter((h) => h.kind === 'new').length;
      this.queue = buildPlan({
        categories: opts.categories,
        size: opts.size,
        now: this.startedAt,
        reviews,
        newRemaining: Math.max(0, this.deps.newPerDay - newToday),
        pickNew: (c, exclude) => GENERATORS[c].randomItemKey(rng, generatorDeps, exclude),
        pickAny: (c) => GENERATORS[c].randomItemKey(rng, generatorDeps),
      });
    }
    this.total = this.queue.length;
  }

  get progress() {
    return { index: this.served, total: this.total };
  }

  async next(): Promise<Question | null> {
    while (this.queue.length) {
      const item = this.queue.shift()!;
      try {
        const question = item.question ?? (await generateQuestion(item.itemKey, this.deps.rng, this.deps.generatorDeps));
        this.current = { item, question };
        this.served++;
        return question;
      } catch (e) {
        console.error(e);
        const replacement = item.replacement ? null : this.replacementFor(item.category);
        if (replacement) this.queue.unshift(replacement);
        else this.total--;
      }
    }
    this.current = null;
    return null;
  }

  private replacementFor(failed: Category): PlanItem | null {
    for (const c of this.categories.filter((c) => c !== failed)) {
      const key = GENERATORS[c].randomItemKey(this.deps.rng, this.deps.generatorDeps);
      if (key) return { itemKey: key, category: c, kind: 'practice', replacement: true };
    }
    return null;
  }

  async answer(response: Response): Promise<AnswerResult> {
    if (!this.current) throw new Error('no question to answer');
    const { item, question } = this.current;
    this.current = null;
    const grade = gradeResponse(question, response);
    const at = this.deps.now();
    await this.deps.store.addHistory({
      itemKey: item.itemKey,
      category: item.category,
      kind: item.kind,
      correct: grade.correct,
      error: grade.error,
      elapsedMs: response.elapsedMs,
      at,
    });
    if (item.kind !== 'practice') {
      const rec = applyReview(this.reviews.get(item.itemKey), item.itemKey, item.category, grade.rating, new Date(at));
      this.reviews.set(item.itemKey, rec);
      await this.deps.store.putReview(rec);
    }
    this.results.push({ item, grade });
    if (grade.correct && question.followUp) {
      const f = question.followUp;
      const kind = item.kind === 'practice' ? 'practice' : this.reviews.has(f.itemKey) ? 'review' : 'new';
      this.queue.unshift({ itemKey: f.itemKey, category: f.category, kind, question: f });
      this.total++;
    }
    return { ...grade, question, response };
  }

  summary(): SessionSummary {
    const byCategory: SessionSummary['byCategory'] = {};
    const misses = new Map<string, number>();
    for (const { item, grade } of this.results) {
      const c = (byCategory[item.category] ??= { total: 0, correct: 0 });
      c.total++;
      if (grade.correct) c.correct++;
      else misses.set(item.itemKey, (misses.get(item.itemKey) ?? 0) + 1);
    }
    const weak = [...misses]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([itemKey, n]) => ({ itemKey, label: labelOfKey(itemKey), misses: n }));
    return {
      total: this.results.length,
      correct: this.results.filter((r) => r.grade.correct).length,
      durationMs: this.deps.now() - this.startedAt,
      byCategory,
      weak,
    };
  }
}
