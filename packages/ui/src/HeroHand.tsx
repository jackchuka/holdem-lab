import type { Card } from '@holdem-lab/engine';
import { PlayingCard } from './PlayingCard';

export function HeroHand({ cards }: { cards: Card[] }) {
  return (
    <div className="hl-row" data-testid="hero">
      {cards.map((c, i) => (
        <PlayingCard key={i} card={c} size="lg" />
      ))}
    </div>
  );
}
