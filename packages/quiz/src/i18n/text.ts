import { QUIZ_MESSAGES, type Locale, type QuizKey } from './messages';
import type { Category } from '../types';

export type Params = Record<string, string | number>;
export type Text = { key: QuizKey; params?: Params };

export const LOCALES: Locale[] = ['ja', 'en'];

export function text(key: QuizKey, params?: Params): Text {
  return params ? { key, params } : { key };
}

export function formatMessage(template: string, params: Params = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

export function renderText(t: Text, locale: Locale): string {
  return formatMessage(QUIZ_MESSAGES[locale][t.key], t.params);
}

export function detectLocale(languages: readonly string[]): Locale {
  return languages[0]?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export const categoryText = (c: Category): Text => text(`category.${c}` as QuizKey);
export const drawText = (drawKey: string): Text => text(`draw.${drawKey}` as QuizKey);
export const handCategoryText = (category: number): Text => text(`hand.${category}` as QuizKey);
