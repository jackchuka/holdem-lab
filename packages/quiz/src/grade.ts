import type { Question, Response } from './types';

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type GradeResult = { correct: boolean; error?: number; rating: Rating };

const FAST_MS = 3000;
const SLOW_MS = 10000;

export function gradeResponse(q: Question, r: Response): GradeResult {
  if (q.answer.kind === 'numeric') {
    if (r.value === undefined) return { correct: false, rating: 'again' };
    const error = Math.round(Math.abs(r.value - q.answer.value) * 10) / 10;
    const tol = q.answer.tolerance;
    if (error > tol) return { correct: false, error, rating: 'again' };
    if (error > tol / 2 || r.elapsedMs >= SLOW_MS) return { correct: true, error, rating: 'hard' };
    if (error <= tol / 4 && r.elapsedMs <= FAST_MS) return { correct: true, error, rating: 'easy' };
    return { correct: true, error, rating: 'good' };
  }
  if (r.choiceIndex !== q.answer.correct && !(r.choiceIndex !== undefined && q.answer.alsoCorrect?.includes(r.choiceIndex))) return { correct: false, rating: 'again' };
  if (r.elapsedMs >= SLOW_MS) return { correct: true, rating: 'hard' };
  if (r.elapsedMs <= FAST_MS) return { correct: true, rating: 'easy' };
  return { correct: true, rating: 'good' };
}
