import { createContext, useContext } from 'react';
import { handCategoryText, renderText, type Locale } from '@holdem-lab/quiz';
import type { FortuneCategory } from '../fortune';
import { UI_MESSAGES, type UiKey } from './messages';

export type Params = Record<string, string | number>;
export type Translator = { locale: Locale; t: (key: UiKey, params?: Params) => string };

export function createTranslator(locale: Locale): Translator {
  return {
    locale,
    t: (key, params = {}) =>
      UI_MESSAGES[locale][key].replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)),
  };
}

export function categoryName(category: FortuneCategory, locale: Locale): string {
  return category === 'RoyalFlush' ? UI_MESSAGES[locale]['hand.royal'] : renderText(handCategoryText(category), locale);
}

export function formatDate(date: string, locale: Locale): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    month: locale === 'ja' ? 'numeric' : 'short',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

const I18nContext = createContext<Translator>(createTranslator('ja'));
export const I18nProvider = I18nContext.Provider;
export const useI18n = (): Translator => useContext(I18nContext);
