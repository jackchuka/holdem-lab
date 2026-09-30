import { describe, expect, it } from 'vitest';
import { applyLocale, loadLocale, mountLocale, saveLocale, type KeyValueStorage } from './locale';

const KEY = 'holdem-lab:home:settings';
function memory(init: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...init };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}
const broken: KeyValueStorage = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
};

describe('loadLocale', () => {
  it('follows the browser language when nothing is saved', () => {
    expect(loadLocale(['ja-JP', 'en'], memory())).toBe('ja');
    expect(loadLocale(['en-US', 'ja'], memory())).toBe('en');
    expect(loadLocale([], null)).toBe('en');
  });

  it('prefers a saved locale', () => {
    expect(loadLocale(['ja-JP'], memory({ [KEY]: '{"locale":"en"}' }))).toBe('en');
  });

  it('falls back to the browser language on garbage or a throwing storage', () => {
    expect(loadLocale(['ja'], memory({ [KEY]: '{' }))).toBe('ja');
    expect(loadLocale(['ja'], memory({ [KEY]: '{"locale":"fr"}' }))).toBe('ja');
    expect(loadLocale(['ja'], memory({ [KEY]: 'null' }))).toBe('ja');
    expect(loadLocale(['ja'], broken)).toBe('ja');
  });
});

describe('saveLocale', () => {
  it('stores the locale as JSON and ignores a throwing storage', () => {
    const s = memory();
    saveLocale('en', s);
    expect(JSON.parse(s.data[KEY])).toEqual({ locale: 'en' });
    expect(() => saveLocale('en', broken)).not.toThrow();
  });
});

describe('applyLocale / mountLocale', () => {
  it('sets lang and data-locale on the root', () => {
    const root = document.createElement('html');
    applyLocale(root, 'en');
    expect(root.lang).toBe('en');
    expect(root.dataset.locale).toBe('en');
  });

  it('applies the loaded locale and toggles and saves on click', () => {
    const root = document.createElement('html');
    const button = document.createElement('button');
    const s = memory();
    mountLocale(root, button, ['ja-JP'], s);
    expect(root.dataset.locale).toBe('ja');
    button.click();
    expect(root.dataset.locale).toBe('en');
    expect(JSON.parse(s.data[KEY])).toEqual({ locale: 'en' });
    button.click();
    expect(root.lang).toBe('ja');
  });

  it('still toggles when storage throws', () => {
    const root = document.createElement('html');
    const button = document.createElement('button');
    mountLocale(root, button, ['ja'], broken);
    button.click();
    expect(root.dataset.locale).toBe('en');
  });
});
