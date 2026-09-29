import { describe, expect, it } from 'vitest';
import { createRng } from '@holdem-lab/engine';
import { buildChoices, formatPercent, nearby, text } from '../src';

describe('buildChoices', () => {
  it('keeps the correct answer and drops duplicate labels', () => {
    const { choices, correctIndex } = buildChoices(
      createRng(1),
      30,
      [{ value: 30.2 }, { value: 43, mistake: text('mistake.betOverPotPlusBet') }, { value: 43.4 }, { value: 25 }, { value: 35 }],
      formatPercent,
    );
    expect(choices).toHaveLength(4);
    expect(choices[correctIndex].label).toBe('30%');
    expect(new Set(choices.map((c) => c.label)).size).toBe(4);
    expect(choices.find((c) => c.label === '43%')?.mistake?.key).toBe('mistake.betOverPotPlusBet');
  });

  it('throws when there are not enough distinct distractors', () => {
    expect(() => buildChoices(createRng(1), 9, [{ value: 9 }, { value: 10 }], String)).toThrow();
  });

  it('builds nearby candidates within bounds', () => {
    expect(nearby(2, [-4, -1, 1, 4], 1, 30).map((c) => c.value)).toEqual([1, 3, 6]);
  });
});
