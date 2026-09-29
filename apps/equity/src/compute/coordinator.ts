import { mergeStats, randomSeed, summarize, type EquityStats } from '@holdem-lab/engine';
import type { Job, WorkerLike, WorkerResponse } from './protocol';

export type { Job, WorkerLike } from './protocol';
export type RunUpdate = { stats: EquityStats; mode: 'exact' | 'mc'; done: boolean };
export type RunError = { message: string; noValidPlayer?: number | null };
export type Coordinator = {
  run(job: Job, onUpdate: (u: RunUpdate) => void, onError: (e: RunError) => void): () => void;
  dispose(): void;
};

type Active = { id: number; onMessage(i: number, data: WorkerResponse): void; fail(e: RunError): void };

type Pool = { createWorker: () => WorkerLike; workerCount: number; sampleCap?: number };

export function createCoordinator(opts: {
  createWorker: () => WorkerLike;
  workerCount: number;
  sampleCap?: number;
  fallback?: { createWorker: () => WorkerLike; sampleCap?: number };
}): Coordinator {
  const workers: WorkerLike[] = [];
  let pool: Pool = opts;
  let nextId = 1;
  let active: Active | null = null;

  const switchToFallback = () => {
    if (!opts.fallback || pool !== opts) return false;
    pool = { ...opts.fallback, workerCount: 1 };
    return true;
  };
  const discard = () => workers.splice(0).forEach((w) => w.terminate());
  const ensure = () => {
    while (workers.length < pool.workerCount) {
      const i = workers.length;
      let w: WorkerLike;
      try {
        w = pool.createWorker();
      } catch (e) {
        discard();
        if (!switchToFallback()) throw e;
        continue;
      }
      w.onmessage = ({ data }) => {
        if (workers[i] === w) active?.onMessage(i, data);
      };
      w.onerror = () => {
        if (workers[i] !== w) return;
        discard();
        switchToFallback();
        active?.fail({ message: 'worker error' });
      };
      workers.push(w);
    }
  };
  const stopAll = (id: number) => workers.forEach((w) => w.postMessage({ type: 'stop', id }));

  return {
    run(job, onUpdate, onError) {
      if (active) stopAll(active.id);
      ensure();
      const id = nextId++;
      const count = workers.length;
      const parts: (EquityStats | null)[] = Array.from({ length: count }, () => null);
      const finished: boolean[] = Array.from({ length: count }, () => false);
      const maxSamples = Math.min(job.stop.maxSamples, pool.sampleCap ?? Infinity);
      const seed = randomSeed();
      const end = () => {
        stopAll(id);
        if (active?.id === id) active = null;
      };

      active = {
        id,
        fail(e) {
          end();
          onError(e);
        },
        onMessage(i, data) {
          if (data.id !== id || active?.id !== id) return;
          if (data.type === 'error') {
            this.fail({ message: data.message, noValidPlayer: data.noValidPlayer });
            return;
          }
          parts[i] = parts[i] ? mergeStats(parts[i], data.stats) : data.stats;
          finished[i] = data.done;
          const merged = parts.filter((p): p is EquityStats => p !== null).reduce(mergeStats);
          const converged =
            data.mode === 'mc' &&
            (merged.samples >= maxSamples || summarize(merged).halfWidth.every((h) => h <= job.stop.halfWidth));
          const done = converged || finished.every(Boolean);
          if (done && merged.samples === 0) {
            this.fail({ message: 'no valid combo assignment', noValidPlayer: null });
            return;
          }
          if (done) end();
          onUpdate({ stats: merged, mode: data.mode, done });
        },
      };

      workers.forEach((w, index) =>
        w.postMessage({
          type: 'start',
          id,
          job,
          partition: { index, count },
          seed: (seed + index * 0x9e3779b1) >>> 0,
          maxUnits: Math.ceil(maxSamples / count),
        }),
      );
      return () => {
        if (active?.id === id) end();
      };
    },
    dispose() {
      if (active) stopAll(active.id);
      active = null;
      discard();
    },
  };
}
