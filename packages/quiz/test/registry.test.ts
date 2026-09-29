import { describe, expect, it } from 'vitest';
import { createRng } from '@holdem-lab/engine';
import { RANGE_SETS_RAW, loadRangeSet } from '@holdem-lab/ranges';
import {
  CATEGORIES,
  GENERATORS,
  LOCALES,
  categoryOfKey,
  generateQuestion,
  labelOfKey,
  renderText,
  type GeneratorDeps,
  type Question,
  type Text,
} from '../src';

const deps: GeneratorDeps = {
  equity: async () => 0.5,
  ranges: loadRangeSet(RANGE_SETS_RAW['6max-100bb-rfi']),
  tolerance: 5,
};

const stageCards = (q: Question) => [
  ...q.stage.hero,
  ...q.stage.board,
  ...(q.stage.context.kind === 'villain' ? q.stage.context.cards : []),
];

const textsOf = (q: Question): Text[] => [
  q.prompt,
  q.explanation.headline,
  ...q.explanation.lines,
  ...(q.choices ?? []).flatMap((c) => (c.mistake ? [c.mistake] : [])),
  ...(q.stage.context.kind === 'villain' && q.stage.context.label ? [q.stage.context.label] : []),
  ...(q.followUp ? textsOf(q.followUp) : []),
];

describe('registry', () => {
  it('maps keys to categories', () => {
    expect(categoryOfKey('eq:AA-vs-KK')).toBe('equity');
    expect(categoryOfKey('outs:oesd')).toBe('outs');
    expect(categoryOfKey('odds:9')).toBe('outs');
    expect(categoryOfKey('rfi:BTN:K7o')).toBe('range');
    expect(categoryOfKey('po:bet-50')).toBe('potodds');
    expect(categoryOfKey('mdf:bet-50')).toBe('potodds');
    expect(() => categoryOfKey('zz:1')).toThrow();
  });

  it('produces valid, fully translated questions across seeds', async () => {
    for (const category of CATEGORIES) {
      for (let seed = 0; seed < 25; seed++) {
        const rng = createRng(seed);
        const key = GENERATORS[category].randomItemKey(rng, deps)!;
        const q = await generateQuestion(key, rng, deps);
        const cards = stageCards(q);
        expect(new Set(cards).size, key).toBe(cards.length);
        if (q.answer.kind === 'choice') {
          const labels = q.choices!.map((c) => c.label);
          expect(new Set(labels).size, key).toBe(labels.length);
          expect(q.answer.correct).toBeGreaterThanOrEqual(0);
          expect(q.answer.correct).toBeLessThan(labels.length);
        }
        for (const locale of LOCALES) {
          for (const t of [...textsOf(q), labelOfKey(key)]) {
            const s = renderText(t, locale);
            expect(s, `${key} ${t.key} ${locale}`).not.toMatch(/\{\w+\}/);
            expect(s.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('keeps four distinct choices for every pot odds key and outs count', async () => {
    for (const key of ['po', 'mdf'].flatMap((p) => [25, 33, 50, 75, 100, 150, 200].map((b) => `${p}:bet-${b}`))) {
      for (let seed = 0; seed < 10; seed++) {
        const q = await generateQuestion(key, createRng(seed), deps);
        expect(new Set(q.choices!.map((c) => c.label)).size, key).toBe(4);
      }
    }
    for (const n of [1, 2, 4, 8, 9, 12, 15]) {
      const q = await generateQuestion(`odds:${n}`, createRng(n), deps);
      expect(new Set(q.choices!.map((c) => c.label)).size, `odds:${n}`).toBe(4);
    }
  });

  it('labels keys in both languages', () => {
    const l = (k: string) => [renderText(labelOfKey(k), 'ja'), renderText(labelOfKey(k), 'en')];
    expect(l('eq:AKs-vs-QQ')).toEqual(['AKs vs QQ', 'AKs vs QQ']);
    expect(l('rfi:UTG:A9o')).toEqual(['UTG A9o', 'UTG A9o']);
    expect(l('outs:flush-draw')).toEqual(['フラッシュドロー', 'Flush draw']);
    expect(l('odds:9')).toEqual(['9アウツの確率', 'Odds with 9 outs']);
    expect(l('po:bet-75')).toEqual(['必要勝率 bet 75%', 'Required equity, bet 75%']);
    expect(l('mdf:bet-75')).toEqual(['MDF bet 75%', 'MDF, bet 75%']);
  });
});
