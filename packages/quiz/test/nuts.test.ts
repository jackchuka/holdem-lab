import { describe, expect, it } from 'vitest';
import { HandCategory, createRng, nutLadder, patternToString } from '@holdem-lab/engine';
import { NUTS_KEYS, NUT_CATEGORY_KEYS, nutMistakeKey, nutsGenerator, renderText, type GeneratorDeps, type Question } from '../src';

const deps: GeneratorDeps = { equity: async () => 0.5, ranges: null, tolerance: 5 };
const SIZES = { flop: 3, turn: 4, river: 5 } as const;

const correctLabel = (q: Question) => {
  if (q.answer.kind !== 'choice') throw new Error('not a choice question');
  return q.choices![q.answer.correct].label;
};

describe('nutsGenerator', () => {
  it('offers 25 new keys and counts 28 items', () => {
    expect(NUTS_KEYS).toHaveLength(25);
    expect(nutsGenerator.universeSize(deps)).toBe(28);
    expect(nutsGenerator.randomItemKey(createRng(1), deps, new Set(NUTS_KEYS.slice(1)))).toBe(NUTS_KEYS[0]);
    expect(nutsGenerator.randomItemKey(createRng(1), deps, new Set(NUTS_KEYS))).toBeNull();
  });

  it('generates every key with the requested nuts and four distinct choices', async () => {
    for (const key of NUTS_KEYS) {
      for (const seed of [1, 2, 3]) {
        const q = await nutsGenerator.generate(key, createRng(seed), deps);
        const [kind, street, cat] = key.split(':') as ['nuts' | 'nutsnext', keyof typeof SIZES, keyof typeof NUT_CATEGORY_KEYS];
        expect(q.itemKey).toBe(key);
        expect(q.category).toBe('nuts');
        expect(q.stage.hero).toEqual([]);
        expect(q.stage.board).toHaveLength(SIZES[street]);
        const ladder = nutLadder(q.stage.board);
        expect(ladder[0].category, key).toBe(NUT_CATEGORY_KEYS[cat]);
        const labels = q.choices!.map((c) => c.label);
        expect(new Set(labels).size, key).toBe(4);
        const top = ladder[0].patterns.map(patternToString);
        expect(top).toContain(correctLabel(q));
        expect(labels.filter((l) => top.includes(l)), key).toHaveLength(1);
        expect(q.choices!.every((c) => c.pattern && patternToString(c.pattern) === c.label)).toBe(true);
        if (kind === 'nuts') {
          expect(q.stage.context).toEqual({ kind: 'none' });
          expect(q.followUp?.itemKey).toBe(`nuts2:${street}`);
        } else {
          if (q.stage.context.kind !== 'prevNuts') throw new Error(key);
          const prevTop = nutLadder(q.stage.board.slice(0, -1), 1)[0].patterns.map(patternToString);
          expect(prevTop).toContain(patternToString(q.stage.context.pattern));
          expect(prevTop.join()).not.toBe(top.join());
          expect(q.followUp).toBeUndefined();
        }
      }
    }
  }, 30_000);

  it('asks for the second tier without offering the nuts', async () => {
    const q = await nutsGenerator.generate('nuts:turn:flush', createRng(7), deps);
    const f = q.followUp!;
    const ladder = nutLadder(f.stage.board);
    expect(f.stage.board).toEqual(q.stage.board);
    expect(ladder[1].patterns.map(patternToString)).toContain(correctLabel(f));
    const top = ladder[0].patterns.map(patternToString);
    expect(f.choices!.some((c) => top.includes(c.label))).toBe(false);
    expect(renderText(f.prompt, 'ja')).toBe('2番目に強い手は？');
  });

  it('generates a standalone second-nuts question', async () => {
    const q = await nutsGenerator.generate('nuts2:river', createRng(3), deps);
    expect(q.itemKey).toBe('nuts2:river');
    expect(q.stage.board).toHaveLength(5);
    expect(nutLadder(q.stage.board)[1].patterns.map(patternToString)).toContain(correctLabel(q));
  });

  it('includes a trap of another category when the nuts are a flush', async () => {
    const q = await nutsGenerator.generate('nuts:flop:flush', createRng(4), deps);
    const ladder = nutLadder(q.stage.board);
    const categoryOfLabel = (label: string) => ladder.find((t) => t.patterns.map(patternToString).includes(label))!.category;
    expect(q.choices!.some((c) => categoryOfLabel(c.label) !== HandCategory.Flush)).toBe(true);
  });

  it('explains wrong picks and names the nuts', async () => {
    const q = await nutsGenerator.generate('nuts:river:straight', createRng(5), deps);
    if (q.answer.kind !== 'choice') throw new Error();
    const wrong = q.choices!.filter((_, i) => i !== (q.answer.kind === 'choice' ? q.answer.correct : -1));
    expect(wrong.every((c) => c.mistake)).toBe(true);
    expect(q.choices![q.answer.correct].mistake).toBeUndefined();
    expect(renderText(q.explanation.headline, 'ja')).toBe(`${correctLabel(q)}：ストレート`);
    expect(q.explanation.lines).toHaveLength(3);
    expect(renderText(q.explanation.lines[0], 'en')).toMatch(/^1\. .+: Straight$/);
  });

  it('writes the next-card prompt', async () => {
    const q = await nutsGenerator.generate('nutsnext:turn:straight', createRng(6), deps);
    expect(renderText(q.prompt, 'ja')).toMatch(/^ターンは [2-9TJQKA][♠♥♦♣]。ナッツは？$/);
    if (q.stage.context.kind !== 'prevNuts') throw new Error();
    expect(renderText(q.stage.context.label, 'ja')).toBe('フロップのナッツ');
    expect(renderText(q.stage.context.label, 'en')).toBe('Nuts on the flop');
  });

  it('rejects invalid keys', async () => {
    for (const key of ['nuts:flop:fullhouse', 'nutsnext:flop:sf', 'nuts2:preflop', 'nuts:flop:toString']) {
      await expect(nutsGenerator.generate(key, createRng(1), deps)).rejects.toThrow();
    }
  });
});

describe('nutMistakeKey', () => {
  it('picks the explanation from the two categories', () => {
    expect(nutMistakeKey(HandCategory.StraightFlush, HandCategory.Flush)).toBe('nuts.miss.sf');
    expect(nutMistakeKey(HandCategory.Quads, HandCategory.Trips)).toBe('nuts.miss.pairedBoard');
    expect(nutMistakeKey(HandCategory.FullHouse, HandCategory.Flush)).toBe('nuts.miss.pairedBoard');
    expect(nutMistakeKey(HandCategory.Flush, HandCategory.Straight)).toBe('nuts.miss.flush');
    expect(nutMistakeKey(HandCategory.Straight, HandCategory.Trips)).toBe('nuts.miss.straight');
    expect(nutMistakeKey(HandCategory.Flush, HandCategory.Flush)).toBe('nuts.miss.sameCategory');
    expect(nutMistakeKey(HandCategory.Trips, HandCategory.TwoPair)).toBe('nuts.miss.weaker');
  });
});
