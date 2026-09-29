import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyStats, parseCards, type PlayerInput } from '@holdem-lab/engine';
import type { Coordinator, Job, RunError, RunUpdate } from './coordinator';
import { useEquity, type EquityRequest } from './useEquity';

type Call = { job: Job; onUpdate: (u: RunUpdate) => void; onError: (e: RunError) => void; cancel: () => void };

function fakeCoordinator() {
  const calls: Call[] = [];
  const coordinator: Coordinator = {
    run: (job, onUpdate, onError) => {
      const cancel = vi.fn();
      calls.push({ job, onUpdate, onError, cancel });
      return cancel;
    },
    dispose: () => {},
  };
  return { coordinator, calls };
}

const stats = (share: number[]) => ({ ...emptyStats(share.length), samples: 1, share });
const req = (key: string, board = '', players = 0, focus = 0): EquityRequest => ({
  key,
  players: Array.from({ length: players }, (): PlayerInput => ({ kind: 'range', combos: [] })),
  board: parseCards(board),
  focus,
});

describe('useEquity', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces rapid input changes into one run', () => {
    const { coordinator, calls } = fakeCoordinator();
    const { rerender, result } = renderHook(({ r }) => useEquity(coordinator, r), { initialProps: { r: req('a') } });
    rerender({ r: req('b', '9s8s2d') });
    expect(result.current.status).toBe('running');
    act(() => void vi.advanceTimersByTime(300));
    expect(calls).toHaveLength(1);
    expect(calls[0].job.board).toHaveLength(3);
    expect(calls[0].job.options.trackNextCard).toBe(true);
  });

  it('runs earlier streets after the main result and caches the outcome', () => {
    const { coordinator, calls } = fakeCoordinator();
    const { rerender, result } = renderHook(({ r }) => useEquity(coordinator, r), { initialProps: { r: req('a', '9s8s2d') } });
    act(() => void vi.advanceTimersByTime(300));
    act(() => calls[0].onUpdate({ stats: stats([0.6, 0.4]), mode: 'exact', done: true }));
    expect(result.current.status).toBe('done');
    expect(calls[1].job.board).toEqual([]);
    act(() => calls[1].onUpdate({ stats: stats([0.7, 0.3]), mode: 'mc', done: true }));
    expect(result.current.streets).toEqual([
      { street: 'pre', equity: [0.7, 0.3] },
      { street: 'flop', equity: [0.6, 0.4] },
    ]);

    rerender({ r: req('b') });
    rerender({ r: req('a', '9s8s2d') });
    expect(result.current.status).toBe('done');
    act(() => void vi.advanceTimersByTime(300));
    expect(calls).toHaveLength(2);
  });

  it('cancels the running job when the input changes or unmounts', () => {
    const { coordinator, calls } = fakeCoordinator();
    const { rerender, unmount } = renderHook(({ r }) => useEquity(coordinator, r), { initialProps: { r: req('a') } });
    act(() => void vi.advanceTimersByTime(300));
    rerender({ r: req('b') });
    expect(calls[0].cancel).toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(300));
    unmount();
    expect(calls[1].cancel).toHaveBeenCalled();
  });

  it('surfaces errors and goes idle without a request', () => {
    const { coordinator, calls } = fakeCoordinator();
    const initialProps: { r: EquityRequest | null } = { r: req('a') };
    const { rerender, result } = renderHook(({ r }) => useEquity(coordinator, r), { initialProps });
    act(() => void vi.advanceTimersByTime(300));
    act(() => calls[0].onError({ message: 'boom' }));
    expect(result.current).toMatchObject({ status: 'error', error: { message: 'boom' } });
    rerender({ r: null });
    expect(result.current.status).toBe('idle');
  });

  it('keeps previous stats only while the request shape is unchanged', () => {
    const { coordinator, calls } = fakeCoordinator();
    const { rerender, result } = renderHook(({ r }) => useEquity(coordinator, r), {
      initialProps: { r: req('a', '9s8s2d', 3) },
    });
    act(() => void vi.advanceTimersByTime(300));
    act(() => calls[0].onUpdate({ stats: stats([0.5, 0.3, 0.2]), mode: 'mc', done: false }));
    rerender({ r: req('b', '9s8s2d', 3) });
    expect(result.current).toMatchObject({ status: 'running', stats: { share: [0.5, 0.3, 0.2] } });
    rerender({ r: req('c', '9s8s2d', 2) });
    expect(result.current).toMatchObject({ status: 'running', stats: null, streets: [] });
  });

  it('drops previous stats when the focus or board changes', () => {
    const { coordinator, calls } = fakeCoordinator();
    const { rerender, result } = renderHook(({ r }) => useEquity(coordinator, r), {
      initialProps: { r: req('a', '9s8s2d', 2) },
    });
    act(() => void vi.advanceTimersByTime(300));
    act(() => calls[0].onUpdate({ stats: stats([0.6, 0.4]), mode: 'mc', done: false }));
    rerender({ r: req('b', '9s8s2d', 2, 1) });
    expect(result.current.stats).toBeNull();
    act(() => void vi.advanceTimersByTime(300));
    act(() => calls[1].onUpdate({ stats: stats([0.6, 0.4]), mode: 'mc', done: false }));
    rerender({ r: req('c', '9s8s2dKh', 2, 1) });
    expect(result.current.stats).toBeNull();
  });

  it('runs street prefixes with monte carlo', () => {
    const { coordinator, calls } = fakeCoordinator();
    renderHook(({ r }) => useEquity(coordinator, r), { initialProps: { r: req('a', '9s8s2dKh4c', 2) } });
    act(() => void vi.advanceTimersByTime(300));
    act(() => calls[0].onUpdate({ stats: stats([0.6, 0.4]), mode: 'exact', done: true }));
    act(() => calls[1].onUpdate({ stats: stats([0.6, 0.4]), mode: 'mc', done: true }));
    act(() => calls[2].onUpdate({ stats: stats([0.6, 0.4]), mode: 'mc', done: true }));
    expect(calls.slice(1).map((c) => [c.job.board.length, c.job.options.mode])).toEqual([
      [0, 'mc'],
      [3, 'mc'],
      [4, 'mc'],
    ]);
  });
});
