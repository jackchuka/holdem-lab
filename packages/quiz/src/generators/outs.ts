import {
  categoryOf,
  drawFeatures,
  drawKey,
  evaluate,
  fullDeck,
  outs,
  type Card,
  type OutsResult,
  type Rng,
} from '@holdem-lab/engine';
import { buildChoices, formatPercent, nearby } from '../choices';
import { drawText, handCategoryText, text } from '../i18n/text';
import type { Generator, Question } from '../types';

export const DRAW_KEYS = [
  'flush-draw',
  'oesd',
  'gutshot',
  'flush-draw+oesd',
  'flush-draw+gutshot',
  'overcards',
  'flush-draw+overcards',
];
export const OUTS_KEYS = DRAW_KEYS.map((k) => `outs:${k}`);
const MAX_ODDS_OUTS = 21;

export type DrawScenario = { hero: Card[]; villain: Card[]; board: Card[]; drawKey: string; outs: OutsResult };

export function dealDrawScenario(
  rng: Rng,
  boardSize: 3 | 4,
  acceptKey: (key: string) => boolean = () => true,
  acceptOuts: (o: OutsResult) => boolean = () => true,
): DrawScenario {
  for (let i = 0; i < 50000; i++) {
    const deck = rng.shuffle(fullDeck());
    const hero = deck.slice(0, 2);
    const board = deck.slice(2, 2 + boardSize);
    const key = drawKey(drawFeatures(hero, board));
    if (!key || !acceptKey(key)) continue;
    const villain = deck.slice(2 + boardSize, 4 + boardSize);
    if (evaluate([...villain, ...board]) <= evaluate([...hero, ...board])) continue;
    const o = outs(hero, villain, board);
    if (o.count === 0 || !acceptOuts(o)) continue;
    return { hero, villain, board, drawKey: key, outs: o };
  }
  throw new Error('could not deal a matching draw scenario');
}

const stageOf = (s: DrawScenario) => ({
  context: {
    kind: 'villain' as const,
    cards: s.villain,
    label: handCategoryText(categoryOf(evaluate([...s.villain, ...s.board]))),
  },
  board: s.board,
  hero: s.hero,
});

const probabilityLines = (o: OutsResult) => [
  text('outs.probabilities', {
    turn: formatPercent(o.turnProbability * 100),
    river: formatPercent(o.riverProbability * 100),
  }),
  text('outs.rule', { n: o.count, approx: o.count * 4 }),
];

function oddsQuestion(s: DrawScenario, rng: Rng): Question {
  const { count, turnProbability, riverProbability } = s.outs;
  const river = riverProbability * 100;
  const { choices, correctIndex } = buildChoices(
    rng,
    river,
    [
      { value: turnProbability * 100, mistake: text('mistake.turnOnly') },
      { value: count * 2, mistake: text('mistake.ruleOfTwo') },
      ...nearby(river, [5, -5, 10, -10, 15], 1, 99),
    ].filter((d) => d.value >= 1 && d.value <= 99),
    formatPercent,
  );
  return {
    itemKey: `odds:${count}`,
    category: 'outs',
    stage: stageOf(s),
    prompt: text('odds.prompt', { n: count }),
    answer: { kind: 'choice', correct: correctIndex },
    choices,
    explanation: { headline: text('value', { value: formatPercent(river) }), lines: probabilityLines(s.outs) },
  };
}

function outsQuestion(s: DrawScenario, rng: Rng): Question {
  const { count } = s.outs;
  const { choices, correctIndex } = buildChoices(
    rng,
    count,
    rng.shuffle(nearby(count, [-4, -3, -2, -1, 1, 2, 3, 4], 1, 30)),
    String,
  );
  return {
    itemKey: `outs:${s.drawKey}`,
    category: 'outs',
    stage: stageOf(s),
    prompt: text('outs.prompt'),
    answer: { kind: 'choice', correct: correctIndex },
    choices,
    explanation: {
      headline: text('outs.headline', { n: count }),
      lines: [drawText(s.drawKey), ...probabilityLines(s.outs)],
    },
    followUp: oddsQuestion(s, rng),
  };
}

export const outsGenerator: Generator = {
  category: 'outs',

  randomItemKey(rng, _deps, exclude) {
    const open = OUTS_KEYS.filter((k) => !exclude?.has(k));
    return open.length ? rng.pick(open) : null;
  },

  async generate(itemKey, rng) {
    const odds = /^odds:(\d+)$/.exec(itemKey);
    if (odds) {
      const n = Number(odds[1]);
      return oddsQuestion(dealDrawScenario(rng, 3, undefined, (o) => o.count === n), rng);
    }
    const key = itemKey.replace(/^outs:/, '');
    if (!DRAW_KEYS.includes(key)) throw new Error(`invalid outs key: ${itemKey}`);
    return outsQuestion(dealDrawScenario(rng, 3, (k) => k === key), rng);
  },

  universeSize: () => OUTS_KEYS.length + MAX_ODDS_OUTS,
};
