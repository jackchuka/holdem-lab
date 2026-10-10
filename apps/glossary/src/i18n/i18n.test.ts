import { describe, expect, it } from 'vitest';
import { UI_MESSAGES } from './messages';
import { createTranslator } from './i18n';

describe('i18n', () => {
  it('has the same keys and placeholders in both languages', () => {
    expect(Object.keys(UI_MESSAGES.en).sort()).toEqual(Object.keys(UI_MESSAGES.ja).sort());
    const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(UI_MESSAGES.ja) as (keyof typeof UI_MESSAGES.ja)[]) {
      expect(holes(UI_MESSAGES.en[key]), key).toEqual(holes(UI_MESSAGES.ja[key]));
    }
  });

  it('fills parameters', () => {
    expect(createTranslator('ja').t('card.position', { n: 12, total: 100 })).toBe('12 / 100');
    expect(createTranslator('en').t('category.math')).toBe('Numbers');
  });
});
