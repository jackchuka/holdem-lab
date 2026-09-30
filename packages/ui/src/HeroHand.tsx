import type { Card, HandPattern } from '@holdem-lab/engine';
import { PlayingCard } from './PlayingCard';

export function HeroHand({ cards, pattern }: { cards: Card[]; pattern?: HandPattern }) {
  return (
    <div className="hl-row" data-testid="hero">
      {pattern
        ? pattern.map((p, i) => <PlayingCard key={i} pattern={p} size="lg" />)
        : cards.length > 0
          ? cards.map((c, i) => <PlayingCard key={i} card={c} size="lg" />)
          : [0, 1].map((i) => <PlayingCard key={i} size="lg" />)}
    </div>
  );
}
