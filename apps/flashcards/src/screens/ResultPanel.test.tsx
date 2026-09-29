import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { parseCards } from '@holdem-lab/engine';
import { text, type Question } from '@holdem-lab/quiz';
import { I18nProvider, createTranslator } from '../i18n/i18n';
import type { AnswerResult } from '../session/runner';
import { ResultPanel } from './ResultPanel';

const question: Question = {
  itemKey: 'rfi:CO:A5s',
  category: 'range',
  stage: { context: { kind: 'position', position: 'CO' }, board: [], hero: parseCards('As5s') },
  prompt: text('range.prompt'),
  answer: { kind: 'choice', correct: 0 },
  choices: [{ label: 'Raise' }, { label: 'Fold' }],
  explanation: {
    headline: text('value', { value: 'Raise' }),
    lines: [],
    grid: { raise: { AA: 1, A5s: 1, A4s: 0.5, '72o': 0 }, highlight: 'A5s' },
  },
};
const result: AnswerResult = { correct: true, rating: 'good', question, response: { choiceIndex: 0, elapsedMs: 1000 } };

afterEach(cleanup);

describe('ResultPanel', () => {
  it('shows the range chart with the asked hand highlighted', () => {
    const { container } = render(
      <I18nProvider value={createTranslator('ja')}>
        <ResultPanel result={result} onNext={() => {}} />
      </I18nProvider>,
    );
    const grid = container.querySelector('[role="grid"]')!;
    expect(grid.getAttribute('aria-label')).toBe('レンジ表');
    const at = (hc: string) => grid.querySelector(`[data-hc="${hc}"]`)!;
    expect(at('A5s').getAttribute('data-highlight')).toBe('true');
    expect(at('AA').getAttribute('data-state')).toBe('in');
    expect(at('A4s').getAttribute('data-state')).toBe('mixed');
    expect(at('72o').getAttribute('data-state')).toBe('out');
    expect(at('AA').textContent).toBe('AA');
  });
});
