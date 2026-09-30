import { useCallback, useEffect, useMemo, useState } from 'react';
import { HomeLink } from '@holdem-lab/ui';
import { SettingsPanel } from './components/SettingsPanel';
import { Sheet } from './components/Sheet';
import { I18nProvider, createTranslator } from './i18n/i18n';
import { Controls } from './player/Controls';
import { DebugOverlay } from './player/DebugOverlay';
import { Legend } from './player/Legend';
import { TrickTabs } from './player/TrickTabs';
import { jumpStep } from './player/playback';
import { usePlayback } from './player/usePlayback';
import { Scene } from './scene/Scene';
import { SceneBoundary } from './scene/SceneBoundary';
import { hasWebGL } from './scene/webgl';
import { loadSettings, saveSettings, type Settings } from './settings';
import { poseAt, stepAt } from './timeline/timeline';
import { TRICKS } from './tricks';

export function App({ autoplay = true }: { autoplay?: boolean }) {
  const [settings, setSettings] = useState(loadSettings);
  const [sheet, setSheet] = useState(false);
  const trick = TRICKS.find((x) => x.id === settings.trick) ?? TRICKS[0];
  const { time, playing, setPlaying, seek, reset } = usePlayback(trick.duration, settings.speed, autoplay);
  const translator = useMemo(() => createTranslator(settings.locale), [settings.locale]);
  const { t, locale } = translator;
  const webgl = useMemo(hasWebGL, []);
  const debug = useMemo(() => new URLSearchParams(location.search).has('debug'), []);
  const closeSheet = useCallback(() => setSheet(false), []);
  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  const step = stepAt(trick, time);
  const pose = useMemo(() => poseAt(trick, time), [trick, time]);
  const fallback = <p className="stage-fallback">{t('stage.noWebgl')}</p>;

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
          <h1>Chips</h1>
          <span className="spacer" />
          <button className="icon-button" aria-label={t('header.settings')} onClick={() => setSheet(true)}>
            ⋯
          </button>
        </header>
        <TrickTabs
          tricks={TRICKS}
          current={trick.id}
          onSelect={(id) => {
            update({ trick: id });
            reset();
          }}
        />
        <div className="stage">
          {webgl ? (
            <SceneBoundary fallback={fallback}>
              <Scene trick={trick} pose={pose} view={settings.view} mirror={settings.mirror} label={t('stage.label', { name: trick.name[locale] })} />
            </SceneBoundary>
          ) : (
            fallback
          )}
          <Legend fingers={trick.fingers} />
          {debug && <DebugOverlay trick={trick} time={time} />}
        </div>
        <p className="caption" data-testid="caption">
          <b>
            {step + 1}/{trick.steps.length}
          </b>
          {trick.steps[step].text[locale]}
        </p>
        <Controls
          trick={trick}
          time={time}
          playing={playing}
          settings={settings}
          onToggle={() => setPlaying(!playing)}
          onSeek={seek}
          onStep={(dir) => seek(jumpStep(trick, time, dir))}
          onSettings={update}
        />
      </div>
      {sheet && (
        <Sheet label={t('settings.title')} onClose={closeSheet}>
          <SettingsPanel settings={settings} onChange={setSettings} />
        </Sheet>
      )}
    </I18nProvider>
  );
}
