import { describe, expect, it } from 'vitest';
import { parseCards } from '../src/cards';
import { outs } from '../src/outs';

const o = (h: string, v: string, b: string) => outs(parseCards(h), parseCards(v), parseCards(b));

describe('outs', () => {
  it('counts a flush draw as 9 outs', () => {
    const r = o('7s6s', 'AdAc', 'Ks9s2h');
    expect(r.count).toBe(9);
    expect(r.unseen).toBe(47);
    expect(r.turnProbability).toBeCloseTo(9 / 47, 6);
    expect(r.riverProbability).toBeCloseTo(0.3497, 3);
  });

  it('counts an open-ended straight draw as 8 outs', () => {
    expect(o('8c7c', 'AhAd', 'Ks6h5s').count).toBe(8);
  });

  it('counts a gutshot as 4 outs', () => {
    expect(o('9c8c', 'AhAd', 'Jd7h2s').count).toBe(4);
  });

  it('uses one card to come on the turn', () => {
    const r = o('7s6s', 'AdAc', 'Ks9s2h3d');
    expect(r.count).toBe(9);
    expect(r.unseen).toBe(46);
    expect(r.riverProbability).toBeCloseTo(9 / 46, 6);
  });

  it('rejects boards that are not flop or turn', () => {
    expect(() => o('7s6s', 'AdAc', 'Ks9s')).toThrow();
  });
});
