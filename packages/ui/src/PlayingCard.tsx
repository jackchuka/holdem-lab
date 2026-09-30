import { RANKS, makeCard, patternCardToString, rankOf, suitOf, type Card, type PatternCard } from '@holdem-lab/engine';

const GLYPHS = ['♠', '♥', '♦', '♣'];
const KEYS = ['s', 'h', 'd', 'c'];

export type CardSize = 'sm' | 'md' | 'lg';

type Props = { card?: Card; pattern?: PatternCard; size?: CardSize };

export function PlayingCard({ card, pattern, size = 'md' }: Props) {
  const c = card ?? (pattern && pattern.rank !== null && pattern.suit !== null ? makeCard(pattern.rank, pattern.suit) : undefined);
  if (c === undefined) {
    if (pattern) return <PatternFace pattern={pattern} size={size} />;
    return <div className={`hl-card hl-card--${size} hl-card--empty`} data-testid="card-slot" />;
  }
  const rank = RANKS[rankOf(c)];
  const suit = suitOf(c);
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

function PatternFace({ pattern, size }: { pattern: PatternCard; size: CardSize }) {
  const label = patternCardToString(pattern);
  const rank = pattern.rank === null ? 'x' : RANKS[pattern.rank];
  const color = pattern.suit === null ? 'var(--suit-s)' : `var(--suit-${KEYS[pattern.suit]})`;
  return (
    <svg className={`hl-card hl-card--${size}`} viewBox="0 0 60 84" role="img" aria-label={label} data-pattern={label}>
      <rect x="1" y="1" width="58" height="82" rx="7" fill="var(--card-bg)" />
      <text x="30" y={pattern.suit === null ? 54 : 40} textAnchor="middle" fontSize={pattern.suit === null ? 36 : 30} fontWeight="700" fill={color}>
        {rank === 'T' ? '10' : rank}
      </text>
      {pattern.suit !== null && (
        <text x="30" y="72" textAnchor="middle" fontSize="28" fill={color}>
          {GLYPHS[pattern.suit]}
        </text>
      )}
    </svg>
  );
}
