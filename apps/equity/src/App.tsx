import { useCallback, useEffect, useMemo, useState } from 'react';
import { summarize } from '@holdem-lab/engine';
import { BoardRow, HomeLink } from '@holdem-lab/ui';
import type { Coordinator } from './compute/coordinator';
import { useEquity, type EquityRequest } from './compute/useEquity';
import { AnalysisTabs } from './components/AnalysisTabs';
import { BoardEditor } from './components/BoardEditor';
import { PlayerEditor } from './components/PlayerEditor';
import { PlayerRow } from './components/PlayerRow';
import { Precision } from './components/Precision';
import type { Presets } from './components/RangeEditor';
import { SettingsPanel } from './components/SettingsPanel';
import { Sheet } from './components/Sheet';
import { Toast } from './components/Toast';
import { I18nProvider, createTranslator } from './i18n/i18n';
import type { UiKey } from './i18n/messages';
import { loadSettings, saveSettings } from './settings';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  addPlayer,
  checkState,
  pickOpponent,
  removePlayer,
  setPlayer,
  toInputs,
  usedCards,
  type AppState,
} from './state';
import { encodeState } from './url';

type SheetState = { kind: 'board' } | { kind: 'player'; index: number } | { kind: 'settings' } | null;
type Props = { coordinator: Coordinator; presets: Presets; initial: AppState; badUrl: boolean };

export function App({ coordinator, presets, initial, badUrl }: Props) {
  const [settings, setSettings] = useState(loadSettings);
  const [state, setState] = useState(initial);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [opponent, setOpponent] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);
  const [toast, setToast] = useState<UiKey | null>(badUrl ? 'toast.badUrl' : null);
  const clearToast = useCallback(() => setToast(null), []);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setToast('toast.copied');
      }
    } catch {
      return;
    }
  };
  const translator = useMemo(() => createTranslator(settings.locale), [settings.locale]);
  const { t } = translator;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = settings.locale;
    root.dataset.theme = settings.theme;
    root.dataset.fourColor = String(settings.fourColor);
    saveSettings(settings);
  }, [settings]);

  const encoded = encodeState(state);
  useEffect(() => history.replaceState(null, '', encoded), [encoded]);

  const readiness = checkState(state);
  const rangeOpponent = pickOpponent(state, opponent);
  const request = useMemo<EquityRequest | null>(
    () =>
      readiness.ok
        ? {
            key: `${encoded}|${rangeOpponent}|${nonce}`,
            players: toInputs(state),
            board: state.board,
            focus: state.focus,
            trackClassesOf: rangeOpponent ?? undefined,
          }
        : null,
    [encoded, rangeOpponent, nonce],
  );
  const view = useEquity(coordinator, request);
  const shown = readiness.ok && (view.mode !== 'exact' || view.status === 'done');
  const summary = shown && view.stats?.samples ? summarize(view.stats) : null;
  const closeSheet = useCallback(() => setSheet(null), []);

  const warningFor = (i: number) => {
    if (!readiness.ok && readiness.reason === 'duplicate' && readiness.players.includes(i)) return t('player.duplicate');
    if (view.status === 'error' && view.error?.noValidPlayer === i) return t('player.noValid');
    return undefined;
  };

  return (
    <I18nProvider value={translator}>
      <div className="app">
        <header className="app-header">
          <HomeLink href={__HOME_LINK__} />
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <h1>Equity</h1>
          <span className="spacer" />
          <button className="icon-button" aria-label={t('header.share')} onClick={() => void share()}>
            ↗
          </button>
          <button className="icon-button" aria-label={t('header.settings')} onClick={() => setSheet({ kind: 'settings' })}>
            ⋯
          </button>
        </header>
        <div className="layout">
          <section className="inputs">
            <div className="zone-label">{t('board.label')}</div>
            <button className="board-button" aria-label={t('board.edit')} onClick={() => setSheet({ kind: 'board' })}>
              <BoardRow cards={state.board} />
            </button>
            {state.players.map((p, i) => (
              <PlayerRow
                key={i}
                index={i}
                player={p}
                presets={presets}
                equity={summary?.equity[i]}
                warning={warningFor(i)}
                onClick={() => setSheet({ kind: 'player', index: i })}
              />
            ))}
            {state.players.length < MAX_PLAYERS && (
              <button className="add-player" onClick={() => setState(addPlayer)}>
                {t('player.add')}
              </button>
            )}
            <Precision view={view} readiness={readiness} onRetry={() => setNonce((n) => n + 1)} />
          </section>
          <AnalysisTabs
            view={shown ? view : { ...view, stats: null, streets: [] }}
            state={state}
            opponent={rangeOpponent}
            onFocus={(focus) => setState((s) => ({ ...s, focus }))}
            onOpponent={setOpponent}
            onPlace={(c) => setState((s) => (s.board.length < 5 && !s.board.includes(c) ? { ...s, board: [...s.board, c] } : s))}
          />
        </div>
        {sheet?.kind === 'board' && (
          <Sheet label={t('board.edit')} onClose={closeSheet}>
            <BoardEditor
              board={state.board}
              used={usedCards(state, { board: true })}
              onChange={(board) => setState((s) => ({ ...s, board }))}
              onDone={closeSheet}
            />
          </Sheet>
        )}
        {sheet?.kind === 'player' && state.players[sheet.index] && (
          <Sheet label={t('player.edit', { n: sheet.index + 1 })} onClose={closeSheet}>
            <PlayerEditor
              key={sheet.index}
              player={state.players[sheet.index]}
              used={usedCards(state, { player: sheet.index })}
              presets={presets}
              canRemove={state.players.length > MIN_PLAYERS}
              onChange={(p) => setState((s) => setPlayer(s, sheet.index, p))}
              onRemove={() => {
                setState((s) => removePlayer(s, sheet.index));
                closeSheet();
              }}
              onDone={closeSheet}
            />
          </Sheet>
        )}
        {sheet?.kind === 'settings' && (
          <Sheet label={t('settings.title')} onClose={closeSheet}>
            <SettingsPanel settings={settings} onChange={setSettings} />
          </Sheet>
        )}
        {toast && <Toast message={t(toast)} onDone={clearToast} />}
      </div>
    </I18nProvider>
  );
}
