import { RANKS, rankOf, suitOf, type Card } from '@holdem-lab/engine';

const GLYPHS = ['♠', '♥', '♦', '♣'];
const KEYS = ['s', 'h', 'd', 'c'];

export type CardSize = 'sm' | 'md' | 'lg';

export function PlayingCard({ card, size = 'md' }: { card?: Card; size?: CardSize }) {
  if (card === undefined) {
    return <div className={`hl-card hl-card--${size} hl-card--empty`} data-testid="card-slot" />;
  }
  const rank = RANKS[rankOf(card)];
  const suit = suitOf(card);
  const color = `var(--suit-${KEYS[suit]})`;
  return (
    <svg
      className={`hl-card hl-card--${size}`}
      viewBox="0 0 60 84"
      role="img"
      aria-label={`${rank}${GLYPHS[suit]}`}
      data-card={`${rank}${KEYS[suit]}`}
    >
      <rect x="1" y="1" width="58" height="82" rx="7" fill="var(--card-bg)" />
      <text x="30" y="40" textAnchor="middle" fontSize="30" fontWeight="700" fill={color}>
        {rank === 'T' ? '10' : rank}
      </text>
      <text x="30" y="72" textAnchor="middle" fontSize="28" fill={color}>
        {GLYPHS[suit]}
      </text>
    </svg>
  );
}
