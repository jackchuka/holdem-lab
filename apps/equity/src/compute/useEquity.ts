import { useEffect, useRef, useState } from 'react';
import { summarize, type Card, type EquityStats, type PlayerInput } from '@holdem-lab/engine';
import type { Coordinator, RunError } from './coordinator';

export type EquityRequest = { key: string; players: PlayerInput[]; board: Card[]; focus: number; trackClassesOf?: number };
export type Street = 'pre' | 'flop' | 'turn' | 'river';
export type StreetPoint = { street: Street; equity: number[] };
export type EquityView = {
  status: 'idle' | 'running' | 'done' | 'error';
  stats: EquityStats | null;
  mode: 'exact' | 'mc' | null;
  error: RunError | null;
  streets: StreetPoint[];
};

export const MAIN_STOP = { halfWidth: 0.001, maxSamples: 2_000_000 };
export const STREET_STOP = { halfWidth: 0.005, maxSamples: 400_000 };
const STREET_OF: Record<number, Street> = { 0: 'pre', 3: 'flop', 4: 'turn', 5: 'river' };
const IDLE: EquityView = { status: 'idle', stats: null, mode: null, error: null, streets: [] };
const CACHE_SIZE = 20;

const sameShape = (a: EquityRequest | null, b: EquityRequest) =>
  !!a &&
  a.players.length === b.players.length &&
  a.focus === b.focus &&
  a.trackClassesOf === b.trackClassesOf &&
  a.board.length === b.board.length &&
  a.board.every((c, i) => c === b.board[i]);

export function useEquity(coordinator: Coordinator, request: EquityRequest | null, delayMs = 300): EquityView {
  const [view, setView] = useState<EquityView>(IDLE);
  const viewRef = useRef(view);
  const cache = useRef(new Map<string, EquityView>());
  const requestRef = useRef(request);
  const shownRef = useRef<EquityRequest | null>(null);
  requestRef.current = request;
  const key = request?.key ?? null;

  useEffect(() => {
    const req = requestRef.current;
    const prev = shownRef.current;
    shownRef.current = req;
    const publish = (v: EquityView) => {
      viewRef.current = v;
      setView(v);
    };
    if (!req) {
      publish(IDLE);
      return;
    }
    const hit = cache.current.get(req.key);
    if (hit) {
      publish(hit);
      return;
    }
    publish({ ...(sameShape(prev, req) ? viewRef.current : IDLE), status: 'running', error: null, streets: [] });

    let alive = true;
    let cancel = () => {};
    const remember = (v: EquityView) => {
      cache.current.set(req.key, v);
      if (cache.current.size > CACHE_SIZE) cache.current.delete(cache.current.keys().next().value!);
    };

    const runStreets = (main: EquityStats) => {
      const lengths = [0, 3, 4].filter((l) => l < req.board.length);
      const points: StreetPoint[] = [];
      const next = (i: number) => {
        if (!alive) return;
        if (i === lengths.length) {
          points.push({ street: STREET_OF[req.board.length], equity: summarize(main).equity });
          const v = { ...viewRef.current, streets: points };
          remember(v);
          publish(v);
          return;
        }
        const len = lengths[i];
        cancel = coordinator.run(
          { players: req.players, board: req.board.slice(0, len), options: { mode: 'mc' }, stop: STREET_STOP },
          (u) => {
            if (!u.done || !alive) return;
            points.push({ street: STREET_OF[len], equity: summarize(u.stats).equity });
            next(i + 1);
          },
          () => next(i + 1),
        );
      };
      next(0);
    };

    const timer = setTimeout(() => {
      cancel = coordinator.run(
        {
          players: req.players,
          board: req.board,
          options: { focus: req.focus, trackNextCard: true, trackClassesOf: req.trackClassesOf },
          stop: MAIN_STOP,
        },
        (u) => {
          if (!alive) return;
          publish({ status: u.done ? 'done' : 'running', stats: u.stats, mode: u.mode, error: null, streets: [] });
          if (u.done) runStreets(u.stats);
        },
        (e) => alive && publish({ ...IDLE, status: 'error', error: e }),
      );
    }, delayMs);

    return () => {
      alive = false;
      clearTimeout(timer);
      cancel();
    };
  }, [coordinator, key, delayMs]);

  return view;
}
