import { RANKS, makeCard, type Card } from '@holdem-lab/engine';

const GLYPHS = ['♠', '♥', '♦', '♣'];
const KEYS = ['s', 'h', 'd', 'c'];
const RANK_ORDER = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

type Props = { disabled: ReadonlySet<Card>; selected: ReadonlySet<Card>; onPick: (c: Card) => void };

export function CardPicker({ disabled, selected, onPick }: Props) {
  return (
    <div className="hl-picker">
      {[0, 1, 2, 3].flatMap((suit) =>
        RANK_ORDER.map((rank) => {
          const card = makeCard(rank, suit);
          const label = RANKS[rank] === 'T' ? '10' : RANKS[rank];
          return (
            <button
              key={card}
              type="button"
              className="hl-picker-card"
              style={{ color: `var(--suit-${KEYS[suit]})` }}
              aria-label={`${label}${GLYPHS[suit]}`}
              aria-pressed={selected.has(card)}
              disabled={disabled.has(card)}
              onClick={() => onPick(card)}
            >
              {label}
              <small>{GLYPHS[suit]}</small>
            </button>
          );
        }),
      )}
    </div>
  );
}
