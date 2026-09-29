import { describe, expect, it } from 'vitest';
import { UI_MESSAGES } from './messages';
import { createTranslator } from './i18n';

describe('i18n', () => {
  it('has the same placeholders in both languages', () => {
    const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(UI_MESSAGES.ja) as (keyof typeof UI_MESSAGES.ja)[]) {
      expect(holes(UI_MESSAGES.en[key]), key).toEqual(holes(UI_MESSAGES.ja[key]));
    }
  });

  it('fills parameters', () => {
    expect(createTranslator('ja').t('player.edit', { n: 2 })).toBe('P2 を編集');
    expect(createTranslator('en').t('player.edit', { n: 2 })).toBe('Edit P2');
  });
});
