import { describe, expect, it } from 'vitest';
import { gradeResponse, text, type Question } from '../src';

const base: Omit<Question, 'answer' | 'choices'> = {
  itemKey: 'x',
  category: 'equity',
  stage: { context: { kind: 'pot', pot: 1, bet: 1 }, board: [], hero: [] },
  prompt: text('equity.prompt'),
  explanation: { headline: text('value', { value: '' }), lines: [] },
};
const numeric: Question = { ...base, answer: { kind: 'numeric', value: 46, tolerance: 4 } };
const choice: Question = {
  ...base,
  answer: { kind: 'choice', correct: 2 },
  choices: [{ label: 'a' }, { label: 'b' }, { label: 'c' }, { label: 'd' }],
};

describe('gradeResponse', () => {
  it('accepts alsoCorrect choices', () => {
    const mixed: Question = { ...choice, answer: { kind: 'choice', correct: 1, alsoCorrect: [0] } };
    expect(gradeResponse(mixed, { choiceIndex: 1, elapsedMs: 2500 }).rating).toBe('easy');
    expect(gradeResponse(mixed, { choiceIndex: 0, elapsedMs: 5000 })).toEqual({ correct: true, rating: 'good' });
    expect(gradeResponse(mixed, { choiceIndex: 2, elapsedMs: 1000 }).correct).toBe(false);
  });

  it('grades numeric answers by error and time', () => {
    expect(gradeResponse(numeric, { value: 46.5, elapsedMs: 2000 })).toEqual({ correct: true, error: 0.5, rating: 'easy' });
    expect(gradeResponse(numeric, { value: 48, elapsedMs: 5000 }).rating).toBe('good');
    expect(gradeResponse(numeric, { value: 49, elapsedMs: 5000 }).rating).toBe('hard');
    expect(gradeResponse(numeric, { value: 46, elapsedMs: 12000 }).rating).toBe('hard');
    expect(gradeResponse(numeric, { value: 51, elapsedMs: 1000 })).toEqual({ correct: false, error: 5, rating: 'again' });
  });

  it('grades choice answers by correctness and time', () => {
    expect(gradeResponse(choice, { choiceIndex: 2, elapsedMs: 2500 }).rating).toBe('easy');
    expect(gradeResponse(choice, { choiceIndex: 2, elapsedMs: 5000 }).rating).toBe('good');
    expect(gradeResponse(choice, { choiceIndex: 2, elapsedMs: 10000 }).rating).toBe('hard');
    expect(gradeResponse(choice, { choiceIndex: 1, elapsedMs: 1000 })).toEqual({ correct: false, rating: 'again' });
  });

  it('treats a missing answer as wrong', () => {
    expect(gradeResponse(numeric, { elapsedMs: 1000 }).correct).toBe(false);
    expect(gradeResponse(choice, { elapsedMs: 1000 }).correct).toBe(false);
  });
});
