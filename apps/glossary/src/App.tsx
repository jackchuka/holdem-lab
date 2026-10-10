import { useCallback, useEffect, useMemo, useState } from 'react';
import { HomeLink } from '@holdem-lab/ui';
import { CardDeck } from './components/CardDeck';
import { CategoryChips } from './components/CategoryChips';
import { SettingsPanel } from './components/SettingsPanel';
import { Sheet } from './components/Sheet';
import { TermList } from './components/TermList';
import { buildDeck, filterEntries, type Filter } from './deck';
import { I18nProvider, createTranslator } from './i18n/i18n';
import { loadSettings, saveSettings } from './settings';
import { ENTRIES } from './terms';

type Tab = 'cards' | 'list';
const TABS: Tab[] = ['cards', 'list'];

export function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState<Tab>('cards');
  const [filter, setFilter] = useState<Filter>('all');
  const translator = useMemo(() => createTranslator(settings.locale), [settings.locale]);
  const { t } = translator;
  const closeSheet = useCallback(() => setSheet(false), []);
  const entries = useMemo(() => filterEntries(ENTRIES, filter), [filter]);
  const deck = useMemo(() => buildDeck(entries, settings.direction), [entries, settings.direction]);

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
        <CategoryChips value={filter} onChange={setFilter} />
        <main className="main" role="tabpanel" aria-label={t(`tabs.${tab}`)}>
          {tab === 'cards' ? (
            <CardDeck key={`${filter}:${settings.direction}`} cards={deck} />
          ) : (
            <TermList entries={entries} showCategory={filter === 'all'} />
          )}
        </main>
        <nav className="tabbar" role="tablist" aria-label={t('tabs.label')}>
          {TABS.map((x) => (
            <button key={x} type="button" role="tab" aria-selected={tab === x} onClick={() => setTab(x)}>
              {t(`tabs.${x}`)}
            </button>
          ))}
        </nav>
      </div>
      {sheet && (
        <Sheet label={t('settings.title')} onClose={closeSheet}>
          <SettingsPanel settings={settings} onChange={setSettings} />
        </Sheet>
      )}
    </I18nProvider>
  );
}
