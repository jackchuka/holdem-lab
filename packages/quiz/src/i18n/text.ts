import { QUIZ_MESSAGES, type Locale, type QuizKey } from './messages';
import type { Category } from '../types';

export type Params = Record<string, string | number>;
export type TextParams = Record<string, string | number | Text>;
export type Text = { key: QuizKey; params?: TextParams };

export const LOCALES: Locale[] = ['ja', 'en'];

export function text(key: QuizKey, params?: TextParams): Text {
  return params ? { key, params } : { key };
}

export function formatMessage(template: string, params: Params = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

export function renderText(t: Text, locale: Locale): string {
  const params: Params = {};
  for (const [k, v] of Object.entries(t.params ?? {})) params[k] = typeof v === 'object' ? renderText(v, locale) : v;
  return formatMessage(QUIZ_MESSAGES[locale][t.key], params);
}

export function detectLocale(languages: readonly string[]): Locale {
  return languages[0]?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export const categoryText = (c: Category): Text => text(`category.${c}` as QuizKey);
export const drawText = (drawKey: string): Text => text(`draw.${drawKey}` as QuizKey);
export const handCategoryText = (category: number): Text => text(`hand.${category}` as QuizKey);
