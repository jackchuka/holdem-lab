import { createContext, useContext } from 'react';
import type { Locale } from '@holdem-lab/quiz';
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

const I18nContext = createContext<Translator>(createTranslator('ja'));
export const I18nProvider = I18nContext.Provider;
export const useI18n = (): Translator => useContext(I18nContext);
