import type { Card } from './cards';
import { multiEquity, summarize } from './multiEquity';

export type EquityResult = { equity: number; win: number; tie: number; iterations: number };
export type EquityOptions = { iterations?: number; seed?: number };

export function equity(
  hero: readonly Card[],
  villain: readonly Card[],
  board: readonly Card[],
  opts: EquityOptions = {},
): EquityResult {
  const stats = multiEquity(
    [
      { kind: 'hand', cards: [hero[0], hero[1]] },
      { kind: 'hand', cards: [villain[0], villain[1]] },
    ],
    board,
    { mode: board.length === 5 ? 'exact' : 'mc', iterations: opts.iterations ?? 20000, seed: opts.seed ?? 1 },
  );
  const s = summarize(stats);
  return { equity: s.equity[0], win: s.win[0], tie: s.tie[0], iterations: stats.samples };
}
