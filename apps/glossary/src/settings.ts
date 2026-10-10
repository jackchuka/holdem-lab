import { LOCALES, detectLocale, type Locale } from '@holdem-lab/quiz';

export type ThemeName = 'felt' | 'dark' | 'light' | 'midnight';
export type Direction = 'en-ja' | 'ja-en';
export type DirectionSetting = Direction | 'random';
export type Settings = { theme: ThemeName; locale: Locale; direction: DirectionSetting };

export const THEMES: ThemeName[] = ['felt', 'dark', 'light', 'midnight'];
export const DIRECTIONS: DirectionSetting[] = ['en-ja', 'ja-en', 'random'];

const KEY = 'holdem-lab:glossary:settings';
type Storage = { getItem(k: string): string | null; setItem(k: string, v: string): void };

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function defaults(): Settings {
  return {
    theme: 'felt',
    locale: detectLocale(typeof navigator === 'undefined' ? [] : navigator.languages),
    direction: 'en-ja',
  };
}

export function loadSettings(storage: Storage | null = browserStorage()): Settings {
  const s = defaults();
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? 'null') as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') return s;
    if (THEMES.includes(raw.theme as ThemeName)) s.theme = raw.theme as ThemeName;
    if (LOCALES.includes(raw.locale as Locale)) s.locale = raw.locale as Locale;
    if (DIRECTIONS.includes(raw.direction as DirectionSetting)) s.direction = raw.direction as DirectionSetting;
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
