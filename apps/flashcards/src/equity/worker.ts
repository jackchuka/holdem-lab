import { equity } from '@holdem-lab/engine';
import type { EquityWorkerRequest, EquityWorkerResponse } from './client';

self.onmessage = (e: MessageEvent<EquityWorkerRequest>) => {
  const { id, hero, villain, board, iterations, seed } = e.data;
  let res: EquityWorkerResponse;
  try {
    res = { id, equity: equity(hero, villain, board, { iterations, seed }).equity };
  } catch (err) {
    res = { id, error: err instanceof Error ? err.message : String(err) };
  }
  self.postMessage(res);
};
