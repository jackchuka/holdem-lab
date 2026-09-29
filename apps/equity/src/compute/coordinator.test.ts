import { describe, expect, it, vi } from 'vitest';
import { parseCards, summarize, type PlayerInput } from '@holdem-lab/engine';
import { createCoordinator, type Coordinator, type RunError, type RunUpdate } from './coordinator';
import type { Job } from './protocol';
import type { WorkerLike } from './protocol';
import { createInlineWorker } from './worker-core';

const hand = (s: string): PlayerInput => {
  const [a, b] = parseCards(s);
  return { kind: 'hand', cards: [a, b] };
};
const job = (players: PlayerInput[], board: string, stop = { halfWidth: 0.001, maxSamples: 2_000_000 }, options: Job['options'] = {}): Job => ({
  players,
  board: parseCards(board),
  options,
  stop,
});
const finish = (c: Coordinator, j: Job) =>
  new Promise<RunUpdate | RunError>((resolve) => {
    c.run(j, (u) => u.done && resolve(u), resolve);
  });
const brokenWorker = (): WorkerLike => {
  const w: WorkerLike = {
    onmessage: null,
    onerror: null,
    postMessage: (m) => {
      if (m.type === 'start') queueMicrotask(() => w.onerror?.(new Error('load failed')));
    },
    terminate: vi.fn(),
  };
  return w;
};
const coordinator = (workerCount = 3, sampleCap?: number) =>
  createCoordinator({ createWorker: createInlineWorker, workerCount, sampleCap });

describe('coordinator', () => {
  it('merges exact work from every worker', async () => {
    const res = (await finish(coordinator(), job([hand('AsKs'), hand('QhQd')], '9s8s2d'))) as RunUpdate;
    expect(res.mode).toBe('exact');
    expect(res.stats.samples).toBe(990);
    expect(summarize(res.stats).equity.reduce((a, b) => a + b)).toBeCloseTo(1, 9);
  });

  it('stops monte carlo once the half-width target is met', async () => {
    const res = (await finish(
      coordinator(),
      job([hand('AsKs'), hand('QhQd')], '', { halfWidth: 0.02, maxSamples: 2_000_000 }, { mode: 'mc' }),
    )) as RunUpdate;
    expect(res.mode).toBe('mc');
    expect(Math.max(...summarize(res.stats).halfWidth)).toBeLessThanOrEqual(0.02);
    expect(res.stats.samples).toBeLessThan(2_000_000);
  });

  it('respects the sample cap', async () => {
    const res = (await finish(
      coordinator(1, 3000),
      job([hand('AsKs'), hand('QhQd')], '', { halfWidth: 0, maxSamples: 2_000_000 }, { mode: 'mc' }),
    )) as RunUpdate;
    expect(res.stats.samples).toBeLessThanOrEqual(3000 + 4096);
  });

  it('drops updates from a superseded run', async () => {
    const c = coordinator();
    const stale: RunUpdate[] = [];
    c.run(job([hand('AsKs'), hand('QhQd')], ''), (u) => stale.push(u), () => {});
    const res = (await finish(c, job([hand('AsKs'), hand('QhQd')], '9s8s2d7h'))) as RunUpdate;
    expect(res.stats.samples).toBe(44);
    expect(stale).toEqual([]);
  });

  it('reports invalid input and impossible deals', async () => {
    const dup = (await finish(coordinator(), job([hand('AsKs'), hand('AsQd')], ''))) as RunError;
    expect(dup.message).toBe('duplicate cards');
    const only = (s: string): PlayerInput => {
      const [a, b] = parseCards(s);
      return { kind: 'range', combos: [{ combo: [a, b], weight: 1 }] };
    };
    const none = (await finish(coordinator(), job([only('AsAh'), only('AsAh')], '9s8s2d'))) as RunError;
    expect(none.noValidPlayer).toBeNull();
  });

  it('fails once on a worker error and recreates the worker for the next run', async () => {
    const created: WorkerLike[] = [];
    const c = createCoordinator({
      createWorker: () => {
        const w = created.length ? createInlineWorker() : brokenWorker();
        created.push(w);
        return w;
      },
      workerCount: 1,
    });
    const errors: RunError[] = [];
    await new Promise<void>((resolve) => c.run(job([hand('AsKs'), hand('QhQd')], '9s8s2d7h'), () => {}, (e) => (errors.push(e), resolve())));
    expect(errors).toEqual([{ message: 'worker error' }]);
    expect(created[0].terminate).toHaveBeenCalled();
    const res = (await finish(c, job([hand('AsKs'), hand('QhQd')], '9s8s2d7h'))) as RunUpdate;
    expect(res.stats.samples).toBe(44);
    expect(errors).toHaveLength(1);
  });

  it('switches to a single capped fallback worker after a worker error', async () => {
    const fallback = vi.fn(createInlineWorker);
    const c = createCoordinator({ createWorker: brokenWorker, workerCount: 4, fallback: { createWorker: fallback, sampleCap: 3000 } });
    const first = (await finish(c, job([hand('AsKs'), hand('QhQd')], ''))) as RunError;
    expect(first.message).toBe('worker error');
    const res = (await finish(
      c,
      job([hand('AsKs'), hand('QhQd')], '', { halfWidth: 0, maxSamples: 2_000_000 }, { mode: 'mc' }),
    )) as RunUpdate;
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(res.stats.samples).toBeLessThanOrEqual(3000 + 4096);
  });

  it('falls back when a worker cannot be constructed', async () => {
    const c = createCoordinator({
      createWorker: () => {
        throw new Error('no workers');
      },
      workerCount: 4,
      fallback: { createWorker: createInlineWorker, sampleCap: 200_000 },
    });
    const res = (await finish(c, job([hand('AsKs'), hand('QhQd')], '9s8s2d7h'))) as RunUpdate;
    expect(res.stats.samples).toBe(44);
  });
});
