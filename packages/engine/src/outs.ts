import { fullDeck, type Card } from './cards';
import { evaluate } from './evaluator';

export type OutsResult = {
  outs: Card[];
  count: number;
  unseen: number;
  turnProbability: number;
  riverProbability: number;
};

export function outs(hero: readonly Card[], villain: readonly Card[], board: readonly Card[]): OutsResult {
  if (board.length !== 3 && board.length !== 4) throw new Error('outs needs a flop or turn board');
  const used = new Set([...hero, ...villain, ...board]);
  const list = fullDeck().filter(
    (c) => !used.has(c) && evaluate([...hero, ...board, c]) > evaluate([...villain, ...board, c]),
  );
  const count = list.length;
  const unseen = 52 - hero.length - board.length;
  const turnProbability = count / unseen;
  const riverProbability =
    board.length === 3 ? 1 - ((unseen - count) / unseen) * ((unseen - 1 - count) / (unseen - 1)) : turnProbability;
  return { outs: list, count, unseen, turnProbability, riverProbability };
}
