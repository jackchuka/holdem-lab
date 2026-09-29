import { describe, expect, it } from 'vitest';
import { QUIZ_MESSAGES, detectLocale, formatMessage, renderText, text } from '../src';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('quiz i18n', () => {
  it('has the same keys and placeholders in ja and en', () => {
    const ja = QUIZ_MESSAGES.ja;
    const en = QUIZ_MESSAGES.en;
    expect(Object.keys(en).sort()).toEqual(Object.keys(ja).sort());
    for (const key of Object.keys(ja) as (keyof typeof ja)[]) {
      expect(ja[key].length, key).toBeGreaterThan(0);
      expect(en[key].length, key).toBeGreaterThan(0);
      expect(new Set(placeholders(en[key])), key).toEqual(new Set(placeholders(ja[key])));
    }
  });

  it('formats placeholders and keeps unknown ones', () => {
    expect(formatMessage('{a} vs {b}', { a: 'AKs', b: 'QQ' })).toBe('AKs vs QQ');
    expect(formatMessage('{n} outs, {n} again', { n: 9 })).toBe('9 outs, 9 again');
    expect(formatMessage('{missing}')).toBe('{missing}');
  });

  it('renders a text in both locales', () => {
    const t = text('outs.headline', { n: 9 });
    expect(renderText(t, 'ja')).toBe('9アウツ');
    expect(renderText(t, 'en')).toBe('9 outs');
  });

  it('detects the locale from the first browser language', () => {
    expect(detectLocale(['ja-JP', 'en-US'])).toBe('ja');
    expect(detectLocale(['ja'])).toBe('ja');
    expect(detectLocale(['en-US', 'ja-JP'])).toBe('en');
    expect(detectLocale([])).toBe('en');
  });
});
