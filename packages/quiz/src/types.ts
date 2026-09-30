import type { Card, HandPattern, Rng } from '@holdem-lab/engine';
import type { Position, RangeSet } from '@holdem-lab/ranges';
import type { Text } from './i18n/text';

export type Category = 'equity' | 'outs' | 'range' | 'potodds' | 'nuts';
export const CATEGORIES: Category[] = ['equity', 'outs', 'range', 'potodds', 'nuts'];

export type Context =
  | { kind: 'villain'; cards: Card[]; label?: Text }
  | { kind: 'position'; position: Position }
  | { kind: 'pot'; pot: number; bet: number }
  | { kind: 'none' }
  | { kind: 'prevNuts'; pattern: HandPattern; label: Text };

export type Choice = { label: string; mistake?: Text; pattern?: HandPattern };

export type Answer = { kind: 'numeric'; value: number; tolerance: number } | { kind: 'choice'; correct: number; alsoCorrect?: number[] };
export type Explanation = {
  headline: Text;
  lines: Text[];
  grid?: { raise: Record<string, number>; highlight: string };
};

export type Question = {
  itemKey: string;
  category: Category;
  stage: { context: Context; board: Card[]; hero: Card[] };
  prompt: Text;
  answer: Answer;
  choices?: Choice[];
  explanation: Explanation;
  followUp?: Question;
};

export type Response = { value?: number; choiceIndex?: number; elapsedMs: number };

export type GeneratorDeps = {
  equity: (hero: Card[], villain: Card[], board: Card[]) => Promise<number>;
  ranges: RangeSet | null;
  tolerance: number;
};

export type Generator = {
  category: Category;
  randomItemKey(rng: Rng, deps: GeneratorDeps, exclude?: ReadonlySet<string>): string | null;
  generate(itemKey: string, rng: Rng, deps: GeneratorDeps): Promise<Question>;
  universeSize(deps: GeneratorDeps): number;
};
