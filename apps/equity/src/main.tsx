import '@holdem-lab/ui/theme.css';
import '@holdem-lab/ui/ui.css';
import './app.css';
import { createRoot } from 'react-dom/client';
import { POSITIONS, RANGE_SETS_RAW, loadRangeSet, rangeFromSpot, type Position, type WeightedRange } from '@holdem-lab/ranges';
import { App } from './App';
import { createCoordinator, type WorkerLike } from './compute/coordinator';
import { createInlineWorker } from './compute/worker-core';
import type { Presets } from './components/RangeEditor';
import { initialState, type AppState } from './state';
import { decodeState } from './url';

function loadPresets(): Presets {
  try {
    const set = loadRangeSet(RANGE_SETS_RAW['6max-100bb-rfi']);
    return Object.fromEntries(POSITIONS.map((p) => [p, rangeFromSpot(set.spots[p])])) as Record<Position, WeightedRange>;
  } catch {
    return null;
  }
}

function restore(): { initial: AppState; badUrl: boolean } {
  try {
    return { initial: decodeState(location.search) ?? initialState(), badUrl: false };
  } catch {
    return { initial: initialState(), badUrl: true };
  }
}

const inline = { createWorker: createInlineWorker, sampleCap: 200_000 };
const coordinator =
  typeof Worker === 'undefined'
    ? createCoordinator({ ...inline, workerCount: 1 })
    : createCoordinator({
        createWorker: () => new Worker(new URL('./compute/worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike,
        workerCount: Math.min(8, Math.max(1, (navigator.hardwareConcurrency ?? 2) - 1)),
        fallback: inline,
      });

const { initial, badUrl } = restore();
createRoot(document.getElementById('root')!).render(
  <App coordinator={coordinator} presets={loadPresets()} initial={initial} badUrl={badUrl} />,
);
