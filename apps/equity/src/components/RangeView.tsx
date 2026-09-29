import { useState } from 'react';
import { comboCount, type EquityStats, type HandClass } from '@holdem-lab/engine';
import { fullRange } from '@holdem-lab/ranges';
import { RangeGrid } from '@holdem-lab/ui';
import { classCells, heatColor } from '../analysis';
import { useI18n } from '../i18n/i18n';
import type { AppState } from '../state';

const FADED = 0.45;

type Props = { stats: EquityStats; state: AppState; opponent: number | null; onOpponent: (i: number) => void };

export function RangeView({ stats, state, opponent, onOpponent }: Props) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<HandClass | null>(null);
  const candidates = state.players.flatMap((p, i) => (i !== state.focus && p.kind !== 'hand' ? [i] : []));
  if (opponent === null || !candidates.length) return <p className="muted center">{t('range.needRange')}</p>;
  const p = state.players[opponent];
  const range = p.kind === 'range' ? p.range : fullRange();
  const cells = classCells(stats);
  const overlay: Record<HandClass, string> = {};
  for (const [hc, c] of cells) overlay[hc] = heatColor((c.equity - 0.5) * (c.faded ? FADED : 1), 0.5);
  const info = selected ? cells.get(selected) : undefined;
  return (
    <div className="range-view">
      <div className="chips">
        <span className="label">{t('analysis.opponent')}</span>
        {candidates.map((i) => (
          <button key={i} className="chip" aria-pressed={i === opponent} onClick={() => onOpponent(i)}>
            {t('player.name', { n: i + 1 })}
          </button>
        ))}
      </div>
      <RangeGrid range={range} overlay={overlay} onCellTap={setSelected} label={t('tab.range')} />
      {selected && info && (
        <p className="muted center">
          {t('range.cell', {
            hc: selected,
            combos: Math.round((range.get(selected) ?? 0) * comboCount(selected) * 10) / 10,
            pct: (info.equity * 100).toFixed(1),
          })}
        </p>
      )}
    </div>
  );
}
