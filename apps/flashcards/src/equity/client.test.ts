import { describe, expect, it, vi } from 'vitest';
import { parseCards } from '@holdem-lab/engine';
import { createMemoryStore } from '../storage/store';
import { createEquityClient, type EquityWorkerRequest, type WorkerLike } from './client';

class FakeWorker implements WorkerLike {
  onmessage: WorkerLike['onmessage'] = null;
  sent: EquityWorkerRequest[] = [];
  terminated = false;
  constructor(private reply: 'ok' | 'error' | 'silent') {}
  postMessage(msg: EquityWorkerRequest) {
    this.sent.push(msg);
    if (this.reply === 'silent') return;
    queueMicrotask(() =>
      this.onmessage?.({ data: this.reply === 'ok' ? { id: msg.id, equity: 0.46 } : { id: msg.id, error: 'boom' } }),
    );
  }
  terminate() {
    this.terminated = true;
  }
}

const hero = parseCards('AsKs');
const villain = parseCards('QhQd');

describe('createEquityClient', () => {
  it('computes once and then serves from cache', async () => {
    const worker = new FakeWorker('ok');
    const eq = createEquityClient({ store: createMemoryStore(), createWorker: () => worker });
    expect(await eq(hero, villain, [])).toBe(0.46);
    expect(await eq(hero, villain, [])).toBe(0.46);
    expect(worker.sent).toHaveLength(1);
    expect(worker.sent[0].iterations).toBe(20000);
  });

  it('rejects worker errors', async () => {
    const eq = createEquityClient({ store: createMemoryStore(), createWorker: () => new FakeWorker('error') });
    await expect(eq(hero, villain, [])).rejects.toThrow('boom');
  });

  it('times out, terminates the worker and recovers with a fresh one', async () => {
    vi.useFakeTimers();
    const workers: FakeWorker[] = [];
    const replies: ('silent' | 'ok')[] = ['silent', 'ok'];
    const eq = createEquityClient({
      store: createMemoryStore(),
      createWorker: () => {
        const w = new FakeWorker(replies[workers.length]);
        workers.push(w);
        return w;
      },
      timeoutMs: 3000,
    });
    const pending = eq(hero, villain, []);
    const rejected = expect(pending).rejects.toThrow('timeout');
    await vi.advanceTimersByTimeAsync(3001);
    await rejected;
    expect(workers[0].terminated).toBe(true);
    vi.useRealTimers();
    expect(await eq(hero, villain, [])).toBe(0.46);
    expect(workers).toHaveLength(2);
  });
});
