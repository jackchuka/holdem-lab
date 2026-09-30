import { describe, expect, it } from 'vitest';
import { cardsToString, fullDeck, parseCards } from '../src/cards';
import { createRng } from '../src/rng';
import { HandCategory } from '../src/evaluator';
import { matchesPattern, nutCategory, nutLadder, patternCardToString, patternToString } from '../src/nuts';

const top = (board: string, n = 3) =>
  nutLadder(parseCards(board))
    .slice(0, n)
    .map((t) => t.patterns.map(patternToString));

describe('patternToString', () => {
  it('writes each kind of pattern card', () => {
    expect(patternCardToString({ rank: 12, suit: 1 })).toBe('A♥');
    expect(patternCardToString({ rank: 8, suit: null })).toBe('T');
    expect(patternCardToString({ rank: null, suit: 1 })).toBe('x♥');
    expect(patternCardToString({ rank: null, suit: null })).toBe('x');
    expect(patternToString([{ rank: 12, suit: 1 }, { rank: null, suit: null }])).toBe('A♥ x');
  });
});

describe('matchesPattern', () => {
  it('matches in either order', () => {
    const [ah, kh, ks] = parseCards('AhKhKs');
    const p: [{ rank: number; suit: number }, { rank: null; suit: number }] = [{ rank: 12, suit: 1 }, { rank: null, suit: 1 }];
    expect(matchesPattern(p, ah, kh)).toBe(true);
    expect(matchesPattern(p, kh, ah)).toBe(true);
    expect(matchesPattern(p, ah, ks)).toBe(false);
  });
});

describe('nutLadder', () => {
  it('finds a straight flush and the blocker that ties it', () => {
    expect(top('KhQhJh7c2d')).toEqual([['A♥ T♥', 'T♥ 9♥'], ['A♥ x♥'], ['T♥ x♥']]);
  });

  it('groups flushes by the highest missing card of the suit', () => {
    expect(top('Kh7h2h')).toEqual([['A♥ x♥'], ['Q♥ x♥'], ['J♥ x♥']]);
    expect(top('Kh7h2h4h')).toEqual([['A♥ x'], ['Q♥ x'], ['J♥ x']]);
  });

  it('finds quads and full houses on a paired board', () => {
    expect(top('KsKd7c')).toEqual([['K K'], ['K 7'], ['7 7']]);
    expect(top('KsKdKc7h2d', 2)).toEqual([['K x'], ['A A']]);
  });

  it('finds straights and sets', () => {
    expect(top('9h8h7c')).toEqual([['J T'], ['T 6'], ['6 5']]);
    expect(top('Ks7d2c')).toEqual([['K K'], ['7 7'], ['2 2']]);
  });

  it('marks a board that plays as x x', () => {
    expect(top('AhKhQhJhTh', 1)).toEqual([['x x']]);
  });

  it('keeps going until a tier of another category appears', () => {
    const ladder = nutLadder(parseCards('Kh7h2h'));
    expect(ladder.length).toBeGreaterThan(6);
    expect(ladder.at(-1)!.category).toBe(HandCategory.Trips);
    expect(ladder.slice(0, -1).every((t) => t.category === HandCategory.Flush)).toBe(true);
  });

  it('stops at depth when the categories already differ', () => {
    expect(nutLadder(parseCards('KsKd7c'), 3)).toHaveLength(3);
  });
});

describe('nutCategory', () => {
  it('matches the category of the first tier', () => {
    const rng = createRng(42);
    for (let i = 0; i < 200; i++) {
      const board = rng.shuffle(fullDeck()).slice(0, 3 + (i % 3));
      expect(nutCategory(board), cardsToString(board)).toBe(nutLadder(board)[0].category);
    }
  });

  it('stops early once the nuts exceed the ceiling', () => {
    const board = parseCards('Kh7h2h4h9s');
    expect(nutCategory(board)).toBe(HandCategory.Flush);
    expect(nutCategory(board, HandCategory.Trips)).toBeGreaterThan(HandCategory.Trips);
    expect(nutCategory(parseCards('Ks7d2c'), HandCategory.Trips)).toBe(HandCategory.Trips);
  });
});
