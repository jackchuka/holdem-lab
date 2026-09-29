import { describe, expect, it } from 'vitest';
import { text } from '@holdem-lab/quiz';
import { createTranslator } from './i18n';
import { UI_MESSAGES } from './messages';

const placeholders = (s: string) => new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

describe('ui i18n', () => {
  it('has the same keys and placeholders in ja and en', () => {
    const { ja, en } = UI_MESSAGES;
    expect(Object.keys(en).sort()).toEqual(Object.keys(ja).sort());
    for (const key of Object.keys(ja) as (keyof typeof ja)[]) {
      expect(placeholders(en[key]), key).toEqual(placeholders(ja[key]));
    }
  });

  it('translates ui strings and quiz texts', () => {
    const ja = createTranslator('ja');
    const en = createTranslator('en');
    expect(ja.t('home.start')).toBe('開始する');
    expect(en.t('home.start')).toBe('Start');
    expect(en.t('summary.rate', { rate: 80, min: 4, sec: 12 })).toBe('80% correct · 4m 12s');
    expect(ja.text(text('category.outs'))).toBe('アウツ');
    expect(en.text(text('category.outs'))).toBe('Outs');
  });
});
