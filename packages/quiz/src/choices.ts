import type { Rng } from '@holdem-lab/engine';
import type { Text } from './i18n/text';
import type { Choice } from './types';

export type Candidate = { value: number; mistake?: Text };

export const formatPercent = (v: number) => `${Math.round(v)}%`;

export function nearby(correct: number, steps: number[], min: number, max: number): Candidate[] {
  return steps
    .map((s) => correct + s)
    .filter((v) => v >= min && v <= max)
    .map((value) => ({ value }));
}

export function buildChoices(
  rng: Rng,
  correct: number,
  distractors: Candidate[],
  format: (v: number) => string,
  count = 4,
): { choices: Choice[]; correctIndex: number } {
  const correctLabel = format(correct);
  const seen = new Set([correctLabel]);
  const picked: Choice[] = [];
  for (const d of distractors) {
    if (picked.length === count - 1) break;
    const label = format(d.value);
    if (seen.has(label)) continue;
    seen.add(label);
    picked.push(d.mistake ? { label, mistake: d.mistake } : { label });
  }
  if (picked.length < count - 1) throw new Error(`not enough distractors for ${correctLabel}`);
  const choices = rng.shuffle<Choice>([{ label: correctLabel }, ...picked]);
  return { choices, correctIndex: choices.findIndex((c) => c.label === correctLabel) };
}
