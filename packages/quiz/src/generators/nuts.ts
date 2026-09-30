import {
  HandCategory,
  fullDeck,
  nutLadder,
  patternCardToString,
  patternToString,
  rankOf,
  suitOf,
  type Card,
  type HandPattern,
  type NutTier,
  type Rng,
} from '@holdem-lab/engine';
import type { QuizKey } from '../i18n/messages';
import { handCategoryText, text, type Text } from '../i18n/text';
import type { Choice, Context, Explanation, Generator, Question } from '../types';

export const NUT_CATEGORY_KEYS = {
  sf: HandCategory.StraightFlush,
  quads: HandCategory.Quads,
  flush: HandCategory.Flush,
  straight: HandCategory.Straight,
  trips: HandCategory.Trips,
} as const;
export type NutCategoryKey = keyof typeof NUT_CATEGORY_KEYS;
export type Street = 'flop' | 'turn' | 'river';

const CATEGORY_KEYS = Object.keys(NUT_CATEGORY_KEYS) as NutCategoryKey[];
const STREETS: Street[] = ['flop', 'turn', 'river'];
const BOARD_SIZE: Record<Street, number> = { flop: 3, turn: 4, river: 5 };
const PREV_STREET = { turn: 'flop', river: 'turn' } as const;
const MAX_DEALS = 5000;
const MIN_TIERS = 5;

export const NUTS_KEYS = [
  ...STREETS.flatMap((s) => CATEGORY_KEYS.map((k) => `nuts:${s}:${k}`)),
  ...(['turn', 'river'] as const).flatMap((s) => CATEGORY_KEYS.map((k) => `nutsnext:${s}:${k}`)),
];
const NUTS2_COUNT = STREETS.length;

export const streetText = (s: Street): Text => text(`nuts.street.${s}` as QuizKey);

const boardPlays = (ladder: NutTier[]) => ladder[0].patterns.some((p) => patternToString(p) === 'x x');
const playable = (ladder: NutTier[]) => ladder.length >= MIN_TIERS && !boardPlays(ladder);
const topKey = (ladder: NutTier[]) => ladder[0].patterns.map(patternToString).join(',');

export function nutMistakeKey(correct: HandCategory, chosen: HandCategory): QuizKey {
  if (chosen === correct) return 'nuts.miss.sameCategory';
  switch (correct) {
    case HandCategory.StraightFlush:
      return 'nuts.miss.sf';
    case HandCategory.Quads:
    case HandCategory.FullHouse:
      return 'nuts.miss.pairedBoard';
    case HandCategory.Flush:
      return 'nuts.miss.flush';
    case HandCategory.Straight:
      return 'nuts.miss.straight';
    default:
      return 'nuts.miss.weaker';
  }
}

function distractorTiers(ladder: NutTier[], answer: number): number[] {
  const order: number[] = [];
  const add = (i: number) => {
    if (i > answer && !order.includes(i)) order.push(i);
  };
  add(answer + 1);
  add(ladder.findIndex((t, i) => i > answer && t.category !== ladder[answer].category));
  for (let i = answer + 1; i < ladder.length; i++) add(i);
  return order.slice(0, 3);
}

const choiceOf = (pattern: HandPattern, mistake?: Text): Choice =>
  mistake ? { label: patternToString(pattern), pattern, mistake } : { label: patternToString(pattern), pattern };

function buildNutChoices(ladder: NutTier[], answer: number, rng: Rng): { choices: Choice[]; correct: number } {
  const right = ladder[answer];
  const wrong = distractorTiers(ladder, answer).map((i) => {
    const p = rng.pick(ladder[i].patterns);
    const mistake = text(nutMistakeKey(right.category, ladder[i].category), {
      hand: patternToString(p),
      name: handCategoryText(ladder[i].category),
      correctName: handCategoryText(right.category),
    });
    return choiceOf(p, mistake);
  });
  const choices = rng.shuffle([choiceOf(rng.pick(right.patterns)), ...wrong]);
  return { choices, correct: choices.findIndex((c) => c.mistake === undefined) };
}

function explanationOf(ladder: NutTier[], answer: number, pattern: HandPattern): Explanation {
  return {
    headline: text('nuts.headline', { hand: patternToString(pattern), name: handCategoryText(ladder[answer].category) }),
    lines: ladder.slice(0, 3).map((t, i) =>
      text('nuts.tier', { n: i + 1, hands: t.patterns.map(patternToString).join(', '), name: handCategoryText(t.category) }),
    ),
  };
}

function ladderQuestion(itemKey: string, board: Card[], ladder: NutTier[], answer: number, prompt: Text, context: Context, rng: Rng): Question {
  const { choices, correct } = buildNutChoices(ladder, answer, rng);
  return {
    itemKey,
    category: 'nuts',
    stage: { context, board, hero: [] },
    prompt,
    answer: { kind: 'choice', correct },
    choices,
    explanation: explanationOf(ladder, answer, choices[correct].pattern!),
  };
}

function dealBoard(rng: Rng, size: number, accept: (ladder: NutTier[]) => boolean): { board: Card[]; ladder: NutTier[] } {
  for (let i = 0; i < MAX_DEALS; i++) {
    const board = rng.shuffle(fullDeck()).slice(0, size);
    const ladder = nutLadder(board);
    if (playable(ladder) && accept(ladder)) return { board, ladder };
  }
  throw new Error('could not deal a matching nuts board');
}

const secondQuestion = (street: Street, board: Card[], ladder: NutTier[], rng: Rng) =>
  ladderQuestion(`nuts2:${street}`, board, ladder, 1, text('nuts.second.prompt'), { kind: 'none' }, rng);

function nutsQuestion(street: Street, key: NutCategoryKey, rng: Rng): Question {
  const { board, ladder } = dealBoard(rng, BOARD_SIZE[street], (l) => l[0].category === NUT_CATEGORY_KEYS[key]);
  const q = ladderQuestion(`nuts:${street}:${key}`, board, ladder, 0, text('nuts.prompt'), { kind: 'none' }, rng);
  return { ...q, followUp: secondQuestion(street, board, ladder, rng) };
}

function nutsNextQuestion(street: 'turn' | 'river', key: NutCategoryKey, rng: Rng): Question {
  const size = BOARD_SIZE[street];
  for (let i = 0; i < MAX_DEALS; i++) {
    const board = rng.shuffle(fullDeck()).slice(0, size);
    const ladder = nutLadder(board);
    if (!playable(ladder) || ladder[0].category !== NUT_CATEGORY_KEYS[key]) continue;
    const prev = nutLadder(board.slice(0, -1), 1);
    if (boardPlays(prev) || topKey(prev) === topKey(ladder)) continue;
    const card = board[size - 1];
    const context: Context = {
      kind: 'prevNuts',
      pattern: prev[0].patterns[0],
      label: text('nuts.prev', { street: streetText(PREV_STREET[street]) }),
    };
    const prompt = text('nutsnext.prompt', {
      street: streetText(street),
      card: patternCardToString({ rank: rankOf(card), suit: suitOf(card) }),
    });
    return ladderQuestion(`nutsnext:${street}:${key}`, board, ladder, 0, prompt, context, rng);
  }
  throw new Error('could not deal a board where the nuts change');
}

export const nutsGenerator: Generator = {
  category: 'nuts',

  randomItemKey(rng, _deps, exclude) {
    const open = NUTS_KEYS.filter((k) => !exclude?.has(k));
    return open.length ? rng.pick(open) : null;
  },

  async generate(itemKey, rng) {
    const second = /^nuts2:(flop|turn|river)$/.exec(itemKey);
    if (second) {
      const street = second[1] as Street;
      const { board, ladder } = dealBoard(rng, BOARD_SIZE[street], () => true);
      return secondQuestion(street, board, ladder, rng);
    }
    const m = /^(nuts|nutsnext):(flop|turn|river):(\w+)$/.exec(itemKey);
    if (m && Object.hasOwn(NUT_CATEGORY_KEYS, m[3])) {
      const street = m[2] as Street;
      const key = m[3] as NutCategoryKey;
      if (m[1] === 'nuts') return nutsQuestion(street, key, rng);
      if (street !== 'flop') return nutsNextQuestion(street, key, rng);
    }
    throw new Error(`invalid nuts key: ${itemKey}`);
  },

  universeSize: () => NUTS_KEYS.length + NUTS2_COUNT,
};
