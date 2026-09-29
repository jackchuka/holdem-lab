import '@holdem-lab/ui/theme.css';
import '@holdem-lab/ui/ui.css';
import './app.css';
import { createRoot } from 'react-dom/client';
import { RANGE_SETS_RAW, loadRangeSet, type RangeSet } from '@holdem-lab/ranges';
import { App } from './App';
import { openStore } from './storage/open';

async function boot() {
  const store = await openStore();
  const { rangeSetId } = await store.getSettings();
  let rangeSet: RangeSet | null = null;
  let rangeError: string | null = null;
  try {
    rangeSet = loadRangeSet(RANGE_SETS_RAW[rangeSetId]);
  } catch (e) {
    rangeError = (e as Error).message;
  }
  createRoot(document.getElementById('root')!).render(<App store={store} rangeSet={rangeSet} rangeError={rangeError} />);
}

void boot();
