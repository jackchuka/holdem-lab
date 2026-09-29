import { describe, expect, it } from 'vitest';
import {
  HAND_CLASSES,
  cardToString,
  comboCount,
  combosOf,
  fullDeck,
  gridPosition,
  handClassAt,
  handClassOf,
  parseCard,
  parseCards,
  rankOf,
  suitOf,
} from '../src/cards';

describe('cards', () => {
  it('parses and prints cards', () => {
    const c = parseCard('As');
    expect(rankOf(c)).toBe(12);
    expect(suitOf(c)).toBe(0);
    expect(cardToString(parseCard('Td'))).toBe('Td');
    expect(parseCards('AsKs Qh').map(cardToString)).toEqual(['As', 'Ks', 'Qh']);
  });

  it('rejects invalid cards', () => {
    expect(() => parseCard('1s')).toThrow();
    expect(() => parseCard('Ax')).toThrow();
    expect(() => parseCards('AsK')).toThrow();
  });

  it('builds a 52 card deck of unique cards', () => {
    expect(new Set(fullDeck()).size).toBe(52);
  });

  it('lays out 169 hand classes on the grid', () => {
    expect(HAND_CLASSES).toHaveLength(169);
    expect(new Set(HAND_CLASSES).size).toBe(169);
    expect(handClassAt(0, 0)).toBe('AA');
    expect(handClassAt(0, 1)).toBe('AKs');
    expect(handClassAt(1, 0)).toBe('AKo');
    expect(handClassAt(12, 12)).toBe('22');
    expect(gridPosition('AKo')).toEqual([1, 0]);
    expect(gridPosition('T9s')).toEqual([4, 5]);
  });

  it('classifies two cards', () => {
    expect(handClassOf(parseCard('Kd'), parseCard('Ad'))).toBe('AKs');
    expect(handClassOf(parseCard('Kd'), parseCard('Ac'))).toBe('AKo');
    expect(handClassOf(parseCard('7h'), parseCard('7c'))).toBe('77');
  });

  it('enumerates combos', () => {
    for (const hc of ['AA', 'AKs', 'AKo']) {
      const combos = combosOf(hc);
      expect(combos).toHaveLength(comboCount(hc));
      for (const [a, b] of combos) expect(handClassOf(a, b)).toBe(hc);
    }
    expect(HAND_CLASSES.reduce((n, hc) => n + comboCount(hc), 0)).toBe(1326);
  });
});
