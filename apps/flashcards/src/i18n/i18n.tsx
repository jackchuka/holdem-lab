import { createContext, useContext } from 'react';
import { formatMessage, renderText, type Locale, type Params, type Text } from '@holdem-lab/quiz';
import { UI_MESSAGES, type UiKey } from './messages';

export type Translator = {
  locale: Locale;
  t: (key: UiKey, params?: Params) => string;
  text: (t: Text) => string;
};

export function createTranslator(locale: Locale): Translator {
  return {
    locale,
    t: (key, params) => formatMessage(UI_MESSAGES[locale][key], params),
    text: (t) => renderText(t, locale),
  };
}

const I18nContext = createContext<Translator>(createTranslator('ja'));

export const I18nProvider = I18nContext.Provider;

export function useI18n(): Translator {
  return useContext(I18nContext);
}
