import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRng, randomSeed } from '@holdem-lab/engine';
import { CATEGORIES, GENERATORS, type GeneratorDeps } from '@holdem-lab/quiz';
import type { RangeSet } from '@holdem-lab/ranges';
import { createEquityClient, type WorkerLike } from './equity/client';
import { I18nProvider, createTranslator } from './i18n/i18n';
import { Home } from './screens/Home';
import { SettingsScreen } from './screens/Settings';
import { Stats } from './screens/Stats';
import { Summary } from './screens/Summary';
import { TabBar, type Tab } from './screens/TabBar';
import { SessionRunner, type SessionOptions, type SessionSummary } from './session/runner';
import { SessionView } from './session/SessionView';
import type { Store } from './storage/store';
import type { Settings } from './types';

type Props = { store: Store; rangeSet: RangeSet | null; rangeError: string | null };

export function App({ store, rangeSet, rangeError }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [runner, setRunner] = useState<SessionRunner | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const starting = useRef(false);

  const loadSettings = useCallback(() => void store.getSettings().then(setSettings), [store]);
  useEffect(loadSettings, [loadSettings]);

  const locale = settings?.locale ?? 'ja';
  const translator = useMemo(() => createTranslator(locale), [locale]);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    root.lang = settings.locale;
    root.dataset.theme = settings.theme;
    root.dataset.fourColor = String(settings.fourColor);
  }, [settings]);

  const equity = useMemo(
    () =>
      createEquityClient({
        store,
        createWorker: () =>
          new Worker(new URL('./equity/worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike,
      }),
    [store],
  );

  const finish = useCallback((s: SessionSummary) => {
    setRunner(null);
    setSummary(s);
  }, []);

  if (!settings) return null;

  const available = rangeSet ? CATEGORIES : CATEGORIES.filter((c) => c !== 'range');
  const generatorDeps: GeneratorDeps = { equity, ranges: rangeSet, tolerance: settings.tolerance };
  const universe = CATEGORIES.reduce((n, c) => n + GENERATORS[c].universeSize(generatorDeps), 0);

  const start = async (opts: SessionOptions) => {
    if (starting.current) return;
    starting.current = true;
    try {
      const r = new SessionRunner({ store, generatorDeps, rng: createRng(randomSeed()), now: Date.now, newPerDay: settings.newPerDay });
      await r.start(opts);
      setSummary(null);
      setRunner(r);
    } catch (e) {
      console.error(e);
    } finally {
      starting.current = false;
    }
  };

  const updateSettings = (s: Settings) => {
    setSettings(s);
    void store.putSettings(s);
  };

  let body;
  if (runner) {
    body = <SessionView runner={runner} onFinish={finish} onQuit={() => setRunner(null)} />;
  } else if (summary) {
    body = <Summary summary={summary} onRetryWeak={(keys) => void start({ itemKeys: keys })} onHome={() => setSummary(null)} />;
  } else {
    body = (
      <div className="app">
        {!store.persistent && <div className="banner">{translator.t('banner.memory')}</div>}
        {rangeError && <div className="banner">{translator.t('banner.range', { error: rangeError })}</div>}
        {tab === 'home' && (
          <Home
            store={store}
            settings={settings}
            available={available}
            onSettings={updateSettings}
            onStart={() => void start({ categories: settings.categories.filter((c) => available.includes(c)), size: settings.sessionSize })}
          />
        )}
        {tab === 'stats' && <Stats store={store} universe={universe} />}
        {tab === 'settings' && (
          <SettingsScreen store={store} settings={settings} rangeSet={rangeSet} onSettings={updateSettings} onImported={loadSettings} />
        )}
        <TabBar tab={tab} onChange={setTab} />
      </div>
    );
  }

  return <I18nProvider value={translator}>{body}</I18nProvider>;
}
