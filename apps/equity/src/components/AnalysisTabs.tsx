import { useState } from 'react';
import type { Card } from '@holdem-lab/engine';
import type { EquityView } from '../compute/useEquity';
import { useI18n } from '../i18n/i18n';
import type { AppState } from '../state';
import { NextCardView } from './NextCardView';
import { RangeView } from './RangeView';
import { StreetsView } from './StreetsView';

type Tab = 'next' | 'range' | 'streets';
const TABS: Tab[] = ['next', 'range', 'streets'];
type Props = {
  view: EquityView;
  state: AppState;
  opponent: number | null;
  onFocus: (i: number) => void;
  onOpponent: (i: number) => void;
  onPlace: (c: Card) => void;
};

export function AnalysisTabs({ view, state, opponent, onFocus, onOpponent, onPlace }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('next');
  return (
    <section className="analysis">
      <div className="seg" role="tablist">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {t(`tab.${k}`)}
          </button>
        ))}
      </div>
      {tab !== 'streets' && (
        <div className="chips">
          <span className="label">{t('analysis.focus')}</span>
          {state.players.map((_, i) => (
            <button key={i} className="chip" aria-pressed={state.focus === i} onClick={() => onFocus(i)}>
              {t('player.name', { n: i + 1 })}
            </button>
          ))}
        </div>
      )}
      {!view.stats ? (
        <p className="muted center">{t('analysis.empty')}</p>
      ) : tab === 'next' ? (
        <NextCardView stats={view.stats} focus={state.focus} boardSize={state.board.length} onPlace={onPlace} />
      ) : tab === 'range' ? (
        <RangeView key={opponent ?? -1} stats={view.stats} state={state} opponent={opponent} onOpponent={onOpponent} />
      ) : (
        <StreetsView streets={view.streets} players={state.players.length} />
      )}
    </section>
  );
}
