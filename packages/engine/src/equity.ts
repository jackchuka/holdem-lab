import { fullDeck, type Card } from './cards';
import { evaluate } from './evaluator';
import { createRng } from './rng';

export type EquityResult = { equity: number; win: number; tie: number; iterations: number };
export type EquityOptions = { iterations?: number; seed?: number };

export function equity(
  hero: readonly Card[],
  villain: readonly Card[],
  board: readonly Card[],
  opts: EquityOptions = {},
): EquityResult {
  const used = new Set([...hero, ...villain, ...board]);
  if (used.size !== hero.length + villain.length + board.length) throw new Error('duplicate cards');
  const rng = createRng(opts.seed ?? 1);
  const deck = fullDeck().filter((c) => !used.has(c));
  const need = 5 - board.length;
  const n = need === 0 ? 1 : (opts.iterations ?? 20000);
  const h = [...hero, ...board];
  const v = [...villain, ...board];
  const hBase = h.length;
  const vBase = v.length;
  let win = 0;
  let tie = 0;
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < need; k++) {
      const j = k + rng.int(deck.length - k);
      [deck[k], deck[j]] = [deck[j], deck[k]];
      h[hBase + k] = deck[k];
      v[vBase + k] = deck[k];
    }
    const a = evaluate(h);
    const b = evaluate(v);
    if (a > b) win++;
    else if (a === b) tie++;
  }
  return { equity: (win + tie / 2) / n, win: win / n, tie: tie / n, iterations: n };
}
