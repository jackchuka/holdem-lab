import { LOCALES, detectLocale, type Locale } from '@holdem-lab/quiz';

const KEY = 'holdem-lab:home:settings';
export type KeyValueStorage = { getItem(k: string): string | null; setItem(k: string, v: string): void };

export function browserStorage(): KeyValueStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function savedLocale(storage: KeyValueStorage | null): Locale | null {
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? 'null') as { locale?: unknown } | null;
    return raw && LOCALES.includes(raw.locale as Locale) ? (raw.locale as Locale) : null;
  } catch {
    return null;
  }
}

export function loadLocale(languages: readonly string[], storage: KeyValueStorage | null): Locale {
  return savedLocale(storage) ?? detectLocale(languages);
}

export function saveLocale(locale: Locale, storage: KeyValueStorage | null): void {
  try {
    storage?.setItem(KEY, JSON.stringify({ locale }));
  } catch {
    return;
  }
}

export function applyLocale(root: HTMLElement, locale: Locale): void {
  root.lang = locale;
  root.dataset.locale = locale;
}

export function mountLocale(root: HTMLElement, button: HTMLElement, languages: readonly string[], storage: KeyValueStorage | null): void {
  let locale = loadLocale(languages, storage);
  applyLocale(root, locale);
  button.addEventListener('click', () => {
    locale = locale === 'ja' ? 'en' : 'ja';
    applyLocale(root, locale);
    saveLocale(locale, storage);
  });
}
