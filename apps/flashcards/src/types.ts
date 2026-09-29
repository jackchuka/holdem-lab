import { CATEGORIES, LOCALES, detectLocale, type Category, type Locale } from '@holdem-lab/quiz';
import type { Card as FsrsCard } from 'ts-fsrs';

export type ThemeName = 'felt' | 'dark' | 'light' | 'midnight';

export type Settings = {
  locale: Locale;
  theme: ThemeName;
  fourColor: boolean;
  newPerDay: number;
  tolerance: number;
  rangeSetId: string;
  sessionSize: number;
  categories: Category[];
};

export function defaultSettings(
  languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages,
): Settings {
  return {
    locale: detectLocale(languages),
    theme: 'felt',
    fourColor: false,
    newPerDay: 20,
    tolerance: 5,
    rangeSetId: '6max-100bb-rfi',
    sessionSize: 20,
    categories: [...CATEGORIES],
  };
}

const THEMES: ThemeName[] = ['felt', 'dark', 'light', 'midnight'];
const isPositive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

export function sanitizeSettings(raw: unknown): Settings {
  const s = defaultSettings();
  if (typeof raw !== 'object' || raw === null) return s;
  const r = raw as Record<string, unknown>;
  if (LOCALES.includes(r.locale as Locale)) s.locale = r.locale as Locale;
  if (THEMES.includes(r.theme as ThemeName)) s.theme = r.theme as ThemeName;
  if (typeof r.fourColor === 'boolean') s.fourColor = r.fourColor;
  if (isPositive(r.newPerDay)) s.newPerDay = r.newPerDay;
  if (isPositive(r.tolerance)) s.tolerance = r.tolerance;
  if (isPositive(r.sessionSize)) s.sessionSize = r.sessionSize;
  if (typeof r.rangeSetId === 'string') s.rangeSetId = r.rangeSetId;
  if (Array.isArray(r.categories)) s.categories = r.categories.filter((c): c is Category => CATEGORIES.includes(c));
  return s;
}

export const ITEM_KINDS: ItemKind[] = ['review', 'new', 'practice'];
export type ItemKind = 'review' | 'new' | 'practice';

export type HistoryEntry = {
  itemKey: string;
  category: Category;
  kind: ItemKind;
  correct: boolean;
  error?: number;
  elapsedMs: number;
  at: number;
};

export type ReviewRecord = {
  itemKey: string;
  category: Category;
  due: number;
  card: FsrsCard;
};
