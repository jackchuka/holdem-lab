import { buildChoices, formatPercent, nearby, type Candidate } from '../choices';
import { text } from '../i18n/text';
import type { Generator } from '../types';
import { dealDrawScenario } from './outs';

const BETS = [25, 33, 50, 75, 100, 150, 200];
const POTS = [20, 40, 60, 80, 100, 120, 160, 200];
export const POT_ODDS_KEYS = ['po', 'mdf'].flatMap((p) => BETS.map((b) => `${p}:bet-${b}`));

const inRange = (d: Candidate) => d.value >= 1 && d.value <= 99;

export const potOddsGenerator: Generator = {
  category: 'potodds',

  randomItemKey(rng, _deps, exclude) {
    const open = POT_ODDS_KEYS.filter((k) => !exclude?.has(k));
    return open.length ? rng.pick(open) : null;
  },

  async generate(itemKey, rng) {
    const m = /^(po|mdf):bet-(\d+)$/.exec(itemKey);
    if (!m || !BETS.includes(Number(m[2]))) throw new Error(`invalid pot odds key: ${itemKey}`);
    const pot = rng.pick(POTS);
    const bet = Math.round((pot * Number(m[2])) / 100);
    const required = (bet / (pot + 2 * bet)) * 100;
    const mdf = (pot / (pot + bet)) * 100;
    const bluff = (bet / (pot + bet)) * 100;
    const s = dealDrawScenario(rng, 4);
    const stage = { context: { kind: 'pot' as const, pot, bet }, board: s.board, hero: s.hero };

    if (m[1] === 'po') {
      const actual = s.outs.riverProbability * 100;
      const { choices, correctIndex } = buildChoices(
        rng,
        required,
        [
          { value: bluff, mistake: text('mistake.betOverPotPlusBet') },
          { value: (bet / pot) * 100, mistake: text('mistake.betOverPot') },
          { value: mdf, mistake: text('mistake.mdf') },
          ...nearby(required, [5, -5, 10, -10, 15], 1, 99),
        ].filter(inRange),
        formatPercent,
      );
      return {
        itemKey,
        category: 'potodds',
        stage,
        prompt: text('potodds.prompt'),
        answer: { kind: 'choice', correct: correctIndex },
        choices,
        explanation: {
          headline: text('value', { value: formatPercent(required) }),
          lines: [
            text('potodds.formula'),
            text('potodds.calc', { bet, pot, pct: formatPercent(required) }),
            text(actual >= required ? 'potodds.call' : 'potodds.fold', { pct: formatPercent(actual), n: s.outs.count }),
          ],
        },
      };
    }

    const { choices, correctIndex } = buildChoices(
      rng,
      mdf,
      [
        { value: required, mistake: text('mistake.requiredEquity') },
        { value: bluff, mistake: text('mistake.bluff') },
        ...nearby(mdf, [5, -5, 10, -10, 15], 1, 99),
      ].filter(inRange),
      formatPercent,
    );
    return {
      itemKey,
      category: 'potodds',
      stage,
      prompt: text('mdf.prompt'),
      answer: { kind: 'choice', correct: correctIndex },
      choices,
      explanation: {
        headline: text('value', { value: formatPercent(mdf) }),
        lines: [text('mdf.formula'), text('mdf.calc', { pot, bet, pct: formatPercent(mdf) })],
      },
    };
  },

  universeSize: () => POT_ODDS_KEYS.length,
};
