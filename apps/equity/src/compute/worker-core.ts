import { NoValidCombosError, createEquitySession, mergeStats, type EquitySession, type EquityStats } from '@holdem-lab/engine';
import type { WorkerLike, WorkerRequest, WorkerResponse } from './protocol';

const BATCH = 2048;

const errorOf = (id: number, e: unknown): WorkerResponse => ({
  type: 'error',
  id,
  message: e instanceof Error ? e.message : String(e),
  noValidPlayer: e instanceof NoValidCombosError ? e.player : undefined,
});

export function createWorkerHandler(
  post: (m: WorkerResponse) => void,
  opts: { sliceMs?: number; schedule?: (fn: () => void) => void; now?: () => number } = {},
): (req: WorkerRequest) => void {
  const sliceMs = opts.sliceMs ?? 50;
  const schedule = opts.schedule ?? ((fn) => setTimeout(fn, 0));
  const now = opts.now ?? (() => performance.now());
  let active = 0;

  return (req) => {
    if (req.type === 'stop') {
      if (active === req.id) active = 0;
      return;
    }
    const { id, job } = req;
    active = id;
    let session: EquitySession;
    try {
      session = createEquitySession(job.players, job.board, { ...job.options, partition: req.partition, seed: req.seed });
    } catch (e) {
      active = 0;
      post(errorOf(id, e));
      return;
    }
    const limit = session.mode === 'mc' ? req.maxUnits : Infinity;
    let units = 0;
    const tick = () => {
      if (active !== id) return;
      const start = now();
      try {
        let acc: EquityStats = session.step(BATCH);
        units += BATCH;
        while (!session.done() && units < limit && now() - start < sliceMs) {
          acc = mergeStats(acc, session.step(BATCH));
          units += BATCH;
        }
        const done = session.done() || units >= limit;
        post({ type: 'progress', id, stats: acc, done, mode: session.mode });
        if (done) active = 0;
        else schedule(tick);
      } catch (e) {
        active = 0;
        post(errorOf(id, e));
      }
    };
    tick();
  };
}

export function createInlineWorker(): WorkerLike {
  const worker: WorkerLike = {
    onmessage: null,
    postMessage: (m) => handle(m),
    terminate: () => {},
  };
  const handle = createWorkerHandler((data) => queueMicrotask(() => worker.onmessage?.({ data })));
  return worker;
}
