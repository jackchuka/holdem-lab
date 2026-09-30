import { HandCategory } from '@holdem-lab/engine';
import { describe, expect, it } from 'vitest';
import { categoryName, createTranslator, formatDate } from './i18n';
import { UI_MESSAGES } from './messages';

describe('i18n', () => {
  it('has the same keys and placeholders in both languages', () => {
    expect(Object.keys(UI_MESSAGES.en).sort()).toEqual(Object.keys(UI_MESSAGES.ja).sort());
    const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(UI_MESSAGES.ja) as (keyof typeof UI_MESSAGES.ja)[]) {
      expect(holes(UI_MESSAGES.en[key]), key).toEqual(holes(UI_MESSAGES.ja[key]));
    }
  });

  it('fills parameters', () => {
    expect(createTranslator('ja').t('view.named', { name: 'たろう', date: '9/30' })).toBe('たろう さんの 9/30 の運勢');
  });

  it('names categories including the royal flush', () => {
    expect(categoryName('RoyalFlush', 'ja')).toBe('ロイヤルフラッシュ');
    expect(categoryName(HandCategory.FullHouse, 'ja')).toBe('フルハウス');
    expect(categoryName(HandCategory.FullHouse, 'en')).toBe('Full house');
  });

  it('formats dates without timezone drift', () => {
    expect(formatDate('2026-09-30', 'ja')).toBe('9/30(水)');
    expect(formatDate('2026-09-30', 'en')).toBe('Wed, Sep 30');
  });
});
