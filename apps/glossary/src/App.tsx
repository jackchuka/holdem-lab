import { useCallback, useEffect, useMemo, useState } from 'react';
import { HomeLink } from '@holdem-lab/ui';
import { SettingsPanel } from './components/SettingsPanel';
import { Sheet } from './components/Sheet';
import { I18nProvider, createTranslator } from './i18n/i18n';
import { loadSettings, saveSettings } from './settings';

export function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [sheet, setSheet] = useState(false);
  const translator = useMemo(() => createTranslator(settings.locale), [settings.locale]);
  const { t } = translator;
  const closeSheet = useCallback(() => setSheet(false), []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = settings.locale;
    root.dataset.theme = settings.theme;
    saveSettings(settings);
  }, [settings]);

  return (
    <I18nProvider value={translator}>
      <div className="app">
        <header className="app-header">
          <HomeLink href={__HOME_LINK__} />
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <h1>Glossary</h1>
          <span className="spacer" />
          <button className="icon-button" aria-label={t('header.settings')} onClick={() => setSheet(true)}>
            ⋯
          </button>
        </header>
      </div>
      {sheet && (
        <Sheet label={t('settings.title')} onClose={closeSheet}>
          <SettingsPanel settings={settings} onChange={setSettings} />
        </Sheet>
      )}
    </I18nProvider>
  );
}
