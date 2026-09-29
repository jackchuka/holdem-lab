import type { ReactNode } from 'react';
import { POSITIONS, comboStats, formatRange, sameRange } from '@holdem-lab/ranges';
import { PlayingCard } from '@holdem-lab/ui';
import { useI18n } from '../i18n/i18n';
import type { PlayerState } from '../state';
import type { Presets } from './RangeEditor';

type Props = { index: number; player: PlayerState; equity?: number; warning?: string; presets: Presets; onClick: () => void };

export function PlayerRow({ index, player, equity, warning, presets, onClick }: Props) {
  const { t } = useI18n();
  const color = `var(--player-${index + 1})`;
  let body: ReactNode;
  if (player.kind === 'hand') {
    body = player.cards.every((c) => c === null) ? (
      <span className="muted">{t('player.empty')}</span>
    ) : (
      <span className="player-cards">
        {player.cards.map((c, i) => (
          <PlayingCard key={i} card={c ?? undefined} size="sm" />
        ))}
      </span>
    );
  } else if (player.kind === 'range') {
    const pos = presets ? POSITIONS.find((p) => sameRange(presets[p], player.range)) : undefined;
    const name = pos ? t('range.preset', { pos }) : formatRange(player.range) || t('player.empty');
    body = <span className="range-chip">{`${name} · ${comboStats(player.range).percent.toFixed(0)}%`}</span>;
  } else {
    body = <span className="range-chip">{t('player.random')}</span>;
  }
  return (
    <button className="player" onClick={onClick} aria-label={t('player.edit', { n: index + 1 })}>
      <span className="player-dot" style={{ background: color }} />
      <span className="player-name">{t('player.name', { n: index + 1 })}</span>
      <span className="player-body">{body}</span>
      <span className="player-eq" data-testid={`equity-${index}`}>
        {equity === undefined ? '—' : `${(equity * 100).toFixed(1)}%`}
      </span>
      {equity !== undefined && <span className="player-bar" style={{ width: `${equity * 100}%`, background: color }} />}
      {warning && <span className="player-warn">{warning}</span>}
    </button>
  );
}
