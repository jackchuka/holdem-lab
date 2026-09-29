import { describe, expect, it } from 'vitest';
import { parseCards } from '../src/cards';
import { HandCategory, categoryOf, compareHands, evaluate } from '../src/evaluator';

const ev = (s: string) => evaluate(parseCards(s));
const cat = (s: string) => categoryOf(ev(s));

describe('evaluate', () => {
  it('detects every category', () => {
    expect(cat('AsKsQsJsTs')).toBe(HandCategory.StraightFlush);
    expect(cat('AhAdAcAsKd')).toBe(HandCategory.Quads);
    expect(cat('KhKdKcQsQd')).toBe(HandCategory.FullHouse);
    expect(cat('Ah9h7h4h2h')).toBe(HandCategory.Flush);
    expect(cat('Td9c8h7s6d')).toBe(HandCategory.Straight);
    expect(cat('7h7d7cKs2d')).toBe(HandCategory.Trips);
    expect(cat('7h7dKcKs2d')).toBe(HandCategory.TwoPair);
    expect(cat('7h7dKcQs2d')).toBe(HandCategory.OnePair);
    expect(cat('Ah9d7c4s2h')).toBe(HandCategory.HighCard);
  });

  it('orders categories', () => {
    const hands = ['Ah9d7c4s2h', '7h7dKcQs2d', '7h7dKcKs2d', '7h7d7cKs2d', 'Td9c8h7s6d', 'Ah9h7h4h2h', 'KhKdKcQsQd', 'AhAdAcAsKd', 'AsKsQsJsTs'];
    for (let i = 1; i < hands.length; i++) expect(ev(hands[i])).toBeGreaterThan(ev(hands[i - 1]));
  });

  it('handles the wheel', () => {
    expect(cat('Ad2c3h4s5d')).toBe(HandCategory.Straight);
    expect(ev('Ad2c3h4s5d')).toBeLessThan(ev('2c3h4s5d6d'));
    expect(cat('As2s3s4s5s')).toBe(HandCategory.StraightFlush);
    expect(ev('As2s3s4s5s')).toBeLessThan(ev('2s3s4s5s6s'));
  });

  it('compares kickers', () => {
    expect(compareHands(ev('AhAd9c7s3d'), ev('AcAs9h6s3c'))).toBe(1);
    expect(compareHands(ev('AhAdAcAs2d'), ev('AhAdAcAsKd'))).toBe(-1);
    expect(compareHands(ev('KhKd5c5s9d'), ev('KcKs5h5d9c'))).toBe(0);
  });

  it('picks the best five of seven', () => {
    expect(compareHands(ev('AhAdKhKdQhQd2c'), ev('AhAdKhKdQh2c3c'))).toBe(0);
    expect(cat('KhKdKc2s2d2hAs')).toBe(HandCategory.FullHouse);
    expect(ev('KhKdKc2s2d2hAs')).toBe(ev('KhKdKc2s2dAs3c'));
    expect(ev('AhKh9h7h4h2hQc')).toBe(ev('AhKh9h7h4hQc3d'));
  });

  it('rejects wrong card counts', () => {
    expect(() => ev('AhKd')).toThrow();
  });
});
