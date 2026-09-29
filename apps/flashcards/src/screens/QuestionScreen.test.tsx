import { fireEvent, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { parseCards } from '@holdem-lab/engine';
import { text, type Locale, type Question } from '@holdem-lab/quiz';
import { I18nProvider, createTranslator } from '../i18n/i18n';
import type { AnswerResult } from '../session/runner';
import { QuestionScreen } from './QuestionScreen';

const question: Question = {
  itemKey: 'po:bet-75',
  category: 'potodds',
  stage: { context: { kind: 'pot', pot: 100, bet: 75 }, board: parseCards('9s8h2sKc'), hero: parseCards('AsJs') },
  prompt: text('potodds.prompt'),
  answer: { kind: 'choice', correct: 1 },
  choices: [{ label: '43%', mistake: text('mistake.betOverPotPlusBet') }, { label: '30%' }, { label: '25%' }, { label: '37%' }],
  explanation: { headline: text('value', { value: '30%' }), lines: [text('potodds.calc', { bet: 75, pot: 100, pct: '30%' })] },
};

const result: AnswerResult = { correct: false, rating: 'again', question, response: { choiceIndex: 0, elapsedMs: 1000 } };

const wrap = (locale: Locale, node: ReactNode) => <I18nProvider value={createTranslator(locale)}>{node}</I18nProvider>;
const noop = () => {};

describe('QuestionScreen', () => {
  it('shows the stage and answers once', () => {
    const onAnswer = vi.fn();
    const { container, getByText } = render(
      wrap('ja', <QuestionScreen question={question} progress={{ index: 3, total: 20 }} result={null} onAnswer={onAnswer} onNext={noop} onQuit={noop} />),
    );
    expect(container.querySelector('[data-testid="progress"]')!.textContent).toBe('3 / 20');
    expect(container.querySelectorAll('[data-testid="board"] svg')).toHaveLength(4);
    expect(container.querySelectorAll('[data-testid="hero"] svg')).toHaveLength(2);
    expect(getByText('コールに必要な勝率は？')).toBeTruthy();
    fireEvent.click(getByText('30%'));
    fireEvent.click(getByText('25%'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer.mock.calls[0][0].choiceIndex).toBe(1);
  });

  it('keeps the cards and shows the mistake after answering', () => {
    const { container, getByText } = render(
      wrap('ja', <QuestionScreen question={question} progress={{ index: 3, total: 20 }} result={result} onAnswer={noop} onNext={noop} onQuit={noop} />),
    );
    expect(container.querySelectorAll('[data-testid="hero"] svg')).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="board"] svg')).toHaveLength(4);
    expect(getByText(/不正解/)).toBeTruthy();
    expect(getByText('ベット ÷ (ポット + ベット) で計算した値')).toBeTruthy();
    expect(container.querySelector('[data-testid="next"]')).not.toBeNull();
    expect(container.querySelector('.choices')).toBeNull();
  });

  it('renders in English', () => {
    const { getByText } = render(
      wrap('en', <QuestionScreen question={question} progress={{ index: 3, total: 20 }} result={result} onAnswer={noop} onNext={noop} onQuit={noop} />),
    );
    expect(getByText(/Wrong/)).toBeTruthy();
    expect(getByText('That is bet ÷ (pot + bet)')).toBeTruthy();
    expect(getByText('Next')).toBeTruthy();
  });
});
