import type { Card } from '@holdem-lab/engine';
import { CardPicker, PlayingCard } from '@holdem-lab/ui';
import { useI18n } from '../i18n/i18n';
import { emptyHand, type PlayerState } from '../state';
import { RangeEditor, type Presets } from './RangeEditor';

type Props = {
  player: PlayerState;
  used: Set<Card>;
  presets: Presets;
  canRemove: boolean;
  onChange: (p: PlayerState) => void;
  onRemove: () => void;
  onDone: () => void;
};

const KINDS = ['hand', 'range', 'random'] as const;
const fresh = (k: (typeof KINDS)[number]): PlayerState =>
  k === 'hand' ? emptyHand() : k === 'range' ? { kind: 'range', range: new Map() } : { kind: 'random' };

function HandEditor({ cards, used, onChange }: { cards: (Card | null)[]; used: Set<Card>; onChange: (c: (Card | null)[]) => void }) {
  const pick = (c: Card) => {
    const at = cards.indexOf(c);
    if (at >= 0) return onChange(cards.map((x, i) => (i === at ? null : x)));
    const slot = cards.indexOf(null);
    if (slot >= 0) onChange(cards.map((x, i) => (i === slot ? c : x)));
  };
  return (
    <>
      <div className="hl-row">
        {cards.map((c, i) => (
          <PlayingCard key={i} card={c ?? undefined} />
        ))}
      </div>
      <CardPicker disabled={used} selected={new Set(cards.filter((c): c is Card => c !== null))} onPick={pick} />
    </>
  );
}

export function PlayerEditor({ player, used, presets, canRemove, onChange, onRemove, onDone }: Props) {
  const { t } = useI18n();
  return (
    <div className="editor">
      <div className="seg" role="tablist">
        {KINDS.map((k) => (
          <button key={k} role="tab" aria-selected={player.kind === k} onClick={() => player.kind !== k && onChange(fresh(k))}>
            {t(`kind.${k}`)}
          </button>
        ))}
      </div>
      {player.kind === 'hand' && (
        <HandEditor
          cards={player.cards}
          used={used}
          onChange={(cards) => {
            onChange({ kind: 'hand', cards });
            if (!cards.includes(null)) onDone();
          }}
        />
      )}
      {player.kind === 'range' && (
        <RangeEditor range={player.range} presets={presets} onChange={(range) => onChange({ kind: 'range', range })} />
      )}
      {player.kind === 'random' && <p className="muted">{t('player.randomHint')}</p>}
      {canRemove && (
        <button className="secondary danger" onClick={onRemove}>
          {t('player.remove')}
        </button>
      )}
    </div>
  );
}
