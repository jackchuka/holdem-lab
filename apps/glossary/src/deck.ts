import type { Direction, DirectionSetting } from './settings';
import type { Category, Entry } from './terms';

export type Filter = Category | 'all';
export type DeckCard = { entry: Entry; direction: Direction };

export function filterEntries(entries: Entry[], filter: Filter): Entry[] {
  return filter === 'all' ? entries : entries.filter((e) => e.category === filter);
}

export function buildDeck(entries: Entry[], setting: DirectionSetting, random: () => number = Math.random): DeckCard[] {
  const cards = [...entries];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.map((entry) => ({
    entry,
    direction: setting === 'random' ? (random() < 0.5 ? 'en-ja' : 'ja-en') : setting,
  }));
}
