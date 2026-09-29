import { describe, expect, it } from 'vitest';
import { HAND_CLASSES, combosOf, parseCard, parseCards, type Card } from '../src/cards';
import {
  NoValidCombosError,
  createEquitySession,
  emptyStats,
  mergeStats,
  multiEquity,
  summarize,
  type PlayerInput,
  type WeightedCombo,
} from '../src/multiEquity';

const hand = (s: string): PlayerInput => {
  const [a, b] = parseCards(s);
  return { kind: 'hand', cards: [a, b] };
};
const range = (classes: Record<string, number>): PlayerInput => ({
  kind: 'range',
  combos: Object.entries(classes).flatMap(([hc, weight]) => combosOf(hc).map((combo): WeightedCombo => ({ combo, weight }))),
});
const random = (): PlayerInput => range(Object.fromEntries(HAND_CLASSES.map((hc) => [hc, 1])));
const board = (s: string): Card[] => parseCards(s);
const eqOf = (players: PlayerInput[], b: string, opts = {}) => summarize(multiEquity(players, board(b), opts)).equity;

describe('multiEquity', () => {
  it('matches known heads-up preflop values', () => {
    const [aa] = eqOf([hand('AhAd'), hand('KsKc')], '', { mode: 'mc', iterations: 60000, seed: 3 });
    expect(Math.abs(aa - 0.82)).toBeLessThan(0.015);
    const [aks] = eqOf([hand('AsKs'), hand('QhQd')], '', { mode: 'mc', iterations: 60000, seed: 3 });
    expect(Math.abs(aks - 0.46)).toBeLessThan(0.015);
  });

  it('is exact on the river and splits ties', () => {
    expect(eqOf([hand('AsAh'), hand('QcQd')], 'KsKd2c7h9s')).toEqual([1, 0]);
    expect(eqOf([hand('2c3d'), hand('4h5s'), hand('6d7c')], 'AsKsQsJsTs')).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it('gives three random hands a third each', () => {
    const eq = eqOf([random(), random(), random()], '', { mode: 'mc', iterations: 60000, seed: 11 });
    for (const e of eq) expect(Math.abs(e - 1 / 3)).toBeLessThan(0.01);
  });

  it('agrees between exact and monte carlo on a multiway flop', () => {
    const players = [hand('AsKs'), hand('QhQd'), range({ JJ: 1, TT: 1, AQs: 1 })];
    const exact = eqOf(players, '9s8s2d', { mode: 'exact' });
    const mc = eqOf(players, '9s8s2d', { mode: 'mc', iterations: 200000, seed: 5 });
    exact.forEach((e, i) => expect(Math.abs(e - mc[i])).toBeLessThan(0.005));
    expect(exact.reduce((a, b) => a + b)).toBeCloseTo(1, 9);
  });

  it('weights range combos', () => {
    const [hero] = eqOf([hand('AsAh'), range({ KK: 1, QQ: 0.5 })], 'Kd7c2h3s9d');
    expect(hero).toBeCloseTo(0.5, 9);
  });

  it('is deterministic per seed', () => {
    const run = () => multiEquity([hand('AsKs'), range({ QQ: 1, JJ: 1 })], [], { mode: 'mc', iterations: 5000, seed: 9 });
    expect(run().share).toEqual(run().share);
  });

  it('chooses exact under the limit and monte carlo above it', () => {
    expect(createEquitySession([hand('AsKs'), hand('QhQd')], board('9s8s2d')).mode).toBe('exact');
    expect(createEquitySession([hand('AsKs'), random()], []).mode).toBe('mc');
  });

  it('splits exact work across partitions without overlap', () => {
    const players = [hand('AsKs'), range({ QQ: 1, JJ: 0.5 })];
    const whole = multiEquity(players, board('9s8s2d'), { mode: 'exact' });
    const parts = [0, 1, 2].map((index) =>
      multiEquity(players, board('9s8s2d'), { mode: 'exact', partition: { index, count: 3 } }),
    );
    const merged = parts.reduce(mergeStats);
    expect(merged.samples).toBeCloseTo(whole.samples, 9);
    merged.share.forEach((v, i) => expect(v).toBeCloseTo(whole.share[i], 9));
  });

  it('steps in chunks and reports done', () => {
    const session = createEquitySession([hand('AsKs'), hand('QhQd')], board('9s8s2d7h'));
    let acc = emptyStats(2);
    while (!session.done()) acc = mergeStats(acc, session.step(7));
    expect(acc.samples).toBe(44);
  });

  it('throws on duplicate fixed cards', () => {
    expect(() => multiEquity([hand('AsKs'), hand('AsQd')], [])).toThrow('duplicate cards');
    expect(() => multiEquity([hand('AsKs'), hand('QdQc')], board('Qd'))).toThrow('duplicate cards');
  });

  it('reports a player whose range is fully blocked', () => {
    const err = (() => {
      try {
        multiEquity([hand('AsAh'), range({ AA: 1 }), range({ KK: 1 })], board('AdAc2c'));
      } catch (e) {
        return e;
      }
    })();
    expect(err).toBeInstanceOf(NoValidCombosError);
    expect((err as NoValidCombosError).player).toBe(1);
  });

  it('reports ranges that can never be dealt together', () => {
    const only = (s: string): PlayerInput => ({ kind: 'range', combos: [{ combo: [parseCard(s.slice(0, 2)), parseCard(s.slice(2))], weight: 1 }] });
    for (const mode of ['exact', 'mc'] as const) {
      expect(() => multiEquity([only('AsAh'), only('AsAh')], [], { mode, iterations: 10 })).toThrow(NoValidCombosError);
    }
  });

  it('summarizes with a shrinking confidence half-width', () => {
    const small = summarize(multiEquity([hand('AsKs'), hand('QhQd')], [], { mode: 'mc', iterations: 1000, seed: 1 }));
    const large = summarize(multiEquity([hand('AsKs'), hand('QhQd')], [], { mode: 'mc', iterations: 16000, seed: 1 }));
    expect(large.halfWidth[0]).toBeLessThan(small.halfWidth[0] / 3);
    expect(summarize(emptyStats(2)).halfWidth[0]).toBe(Infinity);
  });

  describe('learning aggregates', () => {
    const at = (s: string) => parseCard(s);

    it('tracks equity per next card from the focus player', () => {
      const stats = multiEquity([hand('AsAh'), hand('KsKh')], board('2c7d9h'), { mode: 'exact', trackNextCard: true });
      const nc = stats.nextCard!;
      expect(nc.share[at('Kc')] / nc.samples[at('Kc')]).toBeCloseTo(2 / 44, 9);
      expect(nc.share[at('3s')] / nc.samples[at('3s')]).toBeCloseTo(42 / 44, 9);
      expect(nc.samples[at('As')]).toBe(0);
      expect(nc.samples[at('2c')]).toBe(0);
    });

    it('tracks next cards from another focus player', () => {
      const stats = multiEquity([hand('AsAh'), hand('KsKh')], board('2c7d9h'), { mode: 'exact', trackNextCard: true, focus: 1 });
      const nc = stats.nextCard!;
      expect(nc.share[at('Kc')] / nc.samples[at('Kc')]).toBeCloseTo(42 / 44, 9);
    });

    it('skips next-card tracking preflop and on the river', () => {
      expect(multiEquity([hand('AsAh'), hand('KsKh')], board('2c7d9h3s4d'), { trackNextCard: true }).nextCard).toBeUndefined();
      expect(
        multiEquity([hand('AsAh'), hand('KsKh')], [], { mode: 'mc', iterations: 10, trackNextCard: true }).nextCard,
      ).toBeUndefined();
    });

    it('tracks focus equity per opponent hand class', () => {
      const stats = multiEquity([hand('AsAh'), range({ KK: 1, QQ: 0.5 })], board('Kd7c2h3s9d'), { trackClassesOf: 1 });
      const bc = stats.byClass!;
      const kk = HAND_CLASSES.indexOf('KK');
      const qq = HAND_CLASSES.indexOf('QQ');
      expect(bc.share[kk]).toBe(0);
      expect(bc.samples[kk]).toBe(3);
      expect(bc.share[qq] / bc.samples[qq]).toBe(1);
      expect(bc.samples[qq]).toBeCloseTo(3, 9);
    });

    it('ignores class tracking for a fixed hand', () => {
      expect(multiEquity([hand('AsAh'), hand('KsKh')], board('Kd7c2h3s9d'), { trackClassesOf: 1 }).byClass).toBeUndefined();
    });
  });
});
