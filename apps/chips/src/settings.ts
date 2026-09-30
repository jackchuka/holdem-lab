import { LOCALES, detectLocale, type Locale } from '@holdem-lab/quiz';
import { TRICK_IDS, type TrickId } from './tricks/types';

export type ThemeName = 'felt' | 'dark' | 'light' | 'midnight';
export type Speed = 0.25 | 0.5 | 1;
export type ViewName = 'self' | 'front' | 'diagonal' | 'top' | 'opposite';
export type Settings = { theme: ThemeName; locale: Locale; speed: Speed; view: ViewName; mirror: boolean; trick: TrickId };

export const THEMES: ThemeName[] = ['felt', 'dark', 'light', 'midnight'];
export const SPEEDS: Speed[] = [0.25, 0.5, 1];
export const VIEW_NAMES: ViewName[] = ['self', 'front', 'diagonal', 'top', 'opposite'];

const KEY = 'holdem-lab:chips:settings';
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
    speed: 1,
    view: 'self',
    mirror: false,
    trick: 'thumb-flip',
  };
}

export function loadSettings(storage: Storage | null = browserStorage()): Settings {
  const s = defaults();
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? 'null') as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') return s;
    if (THEMES.includes(raw.theme as ThemeName)) s.theme = raw.theme as ThemeName;
    if (LOCALES.includes(raw.locale as Locale)) s.locale = raw.locale as Locale;
    if (SPEEDS.includes(raw.speed as Speed)) s.speed = raw.speed as Speed;
    if (VIEW_NAMES.includes(raw.view as ViewName)) s.view = raw.view as ViewName;
    if (typeof raw.mirror === 'boolean') s.mirror = raw.mirror;
    if (TRICK_IDS.includes(raw.trick as TrickId)) s.trick = raw.trick as TrickId;
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
