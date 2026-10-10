import { describe, expect, it } from 'vitest';
import { buildDeck, filterEntries } from './deck';
import type { Category, Entry } from './terms';

const e = (id: string, category: Category): Entry => ({
  category,
  term: { id, en: id, ja: id, kana: 'あ', def: { ja: 'a', en: 'a' }, example: { en: 'a', ja: 'a' } },
});
const entries = [e('a', 'action'), e('b', 'math'), e('c', 'action'), e('d', 'slang'), e('f', 'action')];

// Deterministic generator so the tests do not depend on Math.random.
function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('filterEntries', () => {
  it('keeps one category or everything', () => {
    expect(filterEntries(entries, 'action').map((x) => x.term.id)).toEqual(['a', 'c', 'f']);
    expect(filterEntries(entries, 'all')).toHaveLength(5);
    expect(filterEntries(entries, 'position')).toEqual([]);
  });
});

describe('buildDeck', () => {
  it('contains every entry exactly once', () => {
    const deck = buildDeck(entries, 'en-ja', seq(0.9, 0.1, 0.5, 0.3, 0.7));
    expect(deck.map((c) => c.entry.term.id).sort()).toEqual(['a', 'b', 'c', 'd', 'f']);
  });

  it('shuffles with the given generator', () => {
    const ids = (r: () => number) => buildDeck(entries, 'en-ja', r).map((c) => c.entry.term.id).join('');
    expect(ids(seq(0))).not.toBe(ids(seq(0.99)));
  });

  it('uses a fixed direction for every card', () => {
    expect(buildDeck(entries, 'ja-en').every((c) => c.direction === 'ja-en')).toBe(true);
  });

  it('picks a direction per card for random and keeps it on the card', () => {
    const deck = buildDeck(entries, 'random', seq(0.1, 0.9));
    const dirs = new Set(deck.map((c) => c.direction));
    expect(dirs).toEqual(new Set(['en-ja', 'ja-en']));
  });

  it('handles an empty list', () => {
    expect(buildDeck([], 'random')).toEqual([]);
  });
});
