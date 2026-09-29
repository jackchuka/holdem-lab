import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { parseCards } from '@holdem-lab/engine';
import { text, type Question } from '@holdem-lab/quiz';
import { I18nProvider, createTranslator } from '../i18n/i18n';
import type { AnswerResult, SessionRunner } from './runner';
import { SessionView } from './SessionView';

const make = (label: string): Question => ({
  itemKey: 'po:bet-75',
  category: 'potodds',
  stage: { context: { kind: 'pot', pot: 100, bet: 75 }, board: parseCards('9s8h2sKc'), hero: parseCards('AsJs') },
  prompt: text('potodds.prompt'),
  answer: { kind: 'choice', correct: 0 },
  choices: [{ label: label }, { label: 'b' }, { label: 'c' }, { label: 'd' }],
  explanation: { headline: text('value', { value: label }), lines: [] },
});

const q1 = make('AAA');
const q2 = make('ZZZ');
const answerResult = (q: Question): AnswerResult => ({ correct: true, rating: 'good', question: q, response: { choiceIndex: 0, elapsedMs: 100 } });

const setup = (runner: Partial<SessionRunner>) =>
  render(
    <I18nProvider value={createTranslator('en')}>
      <SessionView runner={runner as SessionRunner} onFinish={vi.fn()} onQuit={vi.fn()} />
    </I18nProvider>,
  );

describe('SessionView', () => {
  it('keeps the result panel until the next question arrives and advances once', async () => {
    let release!: (q: Question) => void;
    const next = vi
      .fn()
      .mockResolvedValueOnce(q1)
      .mockReturnValueOnce(new Promise<Question>((res) => (release = res)));
    const runner = { next, answer: vi.fn(async () => answerResult(q1)), progress: { index: 1, total: 2 }, summary: vi.fn() };
    const { findByText, getByTestId, queryByText, container } = setup(runner);

    fireEvent.click(await findByText('AAA'));
    await findByText(/Correct/);
    fireEvent.click(getByTestId('next'));
    fireEvent.click(getByTestId('next'));

    expect(next).toHaveBeenCalledTimes(2);
    expect(queryByText('b')).toBeNull();
    expect(container.querySelector('.choices')).toBeNull();
    expect((getByTestId('next') as HTMLButtonElement).disabled).toBe(true);

    await act(async () => release(q2));
    await waitFor(() => expect(container.querySelector('.choices')).not.toBeNull());
    expect(queryByText('ZZZ')).not.toBeNull();
  });

  it('skips to the next question when answering fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const next = vi.fn().mockResolvedValueOnce(q1).mockResolvedValueOnce(q2);
    const runner = { next, answer: vi.fn().mockRejectedValue(new Error('boom')), progress: { index: 1, total: 2 }, summary: vi.fn() };
    const { findByText } = setup(runner);

    fireEvent.click(await findByText('AAA'));
    await findByText('ZZZ');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
