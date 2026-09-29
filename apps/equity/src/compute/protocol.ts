import type { Card, EquityStats, PlayerInput, SessionOptions } from '@holdem-lab/engine';

export type Job = {
  players: PlayerInput[];
  board: Card[];
  options: Omit<SessionOptions, 'seed' | 'partition'>;
  stop: { halfWidth: number; maxSamples: number };
};

export type WorkerRequest =
  | { type: 'start'; id: number; job: Job; partition: { index: number; count: number }; seed: number; maxUnits: number }
  | { type: 'stop'; id: number };

export type WorkerResponse =
  | { type: 'progress'; id: number; stats: EquityStats; done: boolean; mode: 'exact' | 'mc' }
  | { type: 'error'; id: number; message: string; noValidPlayer?: number | null };

export type WorkerLike = {
  postMessage(m: WorkerRequest): void;
  onmessage: ((e: { data: WorkerResponse }) => void) | null;
  onerror?: ((e: unknown) => void) | null;
  terminate(): void;
};
