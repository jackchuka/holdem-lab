import type { Card } from '@holdem-lab/engine';
import { PlayingCard } from './PlayingCard';

export function BoardRow({ cards }: { cards: Card[] }) {
  return (
    <div className="hl-row" data-testid="board">
      {Array.from({ length: 5 }, (_, i) => (
        <PlayingCard key={i} card={cards[i]} />
      ))}
    </div>
  );
}
