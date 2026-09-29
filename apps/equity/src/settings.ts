import { LOCALES, detectLocale, type Locale } from '@holdem-lab/quiz';

export type ThemeName = 'felt' | 'dark' | 'light' | 'midnight';
export type Settings = { theme: ThemeName; locale: Locale; fourColor: boolean };
export const THEMES: ThemeName[] = ['felt', 'dark', 'light', 'midnight'];

const KEY = 'holdem-lab:equity:settings';
type Storage = { getItem(k: string): string | null; setItem(k: string, v: string): void };

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function defaults(): Settings {
  return { theme: 'felt', locale: detectLocale(typeof navigator === 'undefined' ? [] : navigator.languages), fourColor: false };
}

export function loadSettings(storage: Storage | null = browserStorage()): Settings {
  const s = defaults();
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? 'null') as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') return s;
    if (THEMES.includes(raw.theme as ThemeName)) s.theme = raw.theme as ThemeName;
    if (LOCALES.includes(raw.locale as Locale)) s.locale = raw.locale as Locale;
    if (typeof raw.fourColor === 'boolean') s.fourColor = raw.fourColor;
  } catch {
    return s;
  }
  return s;
}

export function saveSettings(s: Settings, storage: Storage | null = browserStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(s));
  } catch {
    return;
  }
}
