import { cardsToString, randomSeed, type Card } from '@holdem-lab/engine';
import type { Store } from '../storage/store';

export type EquityWorkerRequest = {
  id: number;
  hero: Card[];
  villain: Card[];
  board: Card[];
  iterations: number;
  seed: number;
};
export type EquityWorkerResponse = { id: number; equity: number } | { id: number; error: string };
export type WorkerLike = {
  postMessage(msg: EquityWorkerRequest): void;
  onmessage: ((e: { data: EquityWorkerResponse }) => void) | null;
  terminate(): void;
};

type Pending = { resolve: (v: number) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };

export function createEquityClient(opts: {
  store: Pick<Store, 'getEquity' | 'putEquity'>;
  createWorker: () => WorkerLike;
  timeoutMs?: number;
  iterations?: number;
}) {
  const timeoutMs = opts.timeoutMs ?? 3000;
  const iterations = opts.iterations ?? 20000;
  const pending = new Map<number, Pending>();
  let worker: WorkerLike | null = null;
  let nextId = 1;

  const ensureWorker = () => {
    if (worker) return worker;
    const w = opts.createWorker();
    w.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      pending.delete(data.id);
      clearTimeout(p.timer);
      if ('error' in data) p.reject(new Error(data.error));
      else p.resolve(data.equity);
    };
    worker = w;
    return w;
  };

  const reset = () => {
    worker?.terminate();
    worker = null;
    for (const [id, p] of pending) {
      clearTimeout(p.timer);
      p.reject(new Error('equity worker reset'));
      pending.delete(id);
    }
  };

  return async (hero: Card[], villain: Card[], board: Card[]): Promise<number> => {
    const key = `${cardsToString(hero)}|${cardsToString(villain)}|${cardsToString(board)}`;
    const cached = await opts.store.getEquity(key);
    if (cached !== undefined) return cached;
    const id = nextId++;
    const value = await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('equity timeout'));
        reset();
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      ensureWorker().postMessage({ id, hero, villain, board, iterations, seed: randomSeed() });
    });
    await opts.store.putEquity(key, value);
    return value;
  };
}
