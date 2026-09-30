import '@holdem-lab/ui/theme.css';
import '@holdem-lab/ui/ui.css';
import './app.css';
import { createRoot } from 'react-dom/client';
import { App, type View } from './App';
import { createStore, localDate, myKey } from './store';
import { decodeShare } from './url';

const store = createStore();
const today = localDate();

function restore(): { initial: View; badUrl: boolean } {
  const mine: View = { key: myKey(store), date: today, source: 'mine' };
  try {
    const shared = decodeShare(location.search, today);
    return { initial: shared ? { ...shared, source: 'shared' } : mine, badUrl: false };
  } catch {
    history.replaceState(null, '', location.pathname);
    return { initial: mine, badUrl: true };
  }
}

const { initial, badUrl } = restore();
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
createRoot(document.getElementById('root')!).render(
  <App store={store} today={localDate} initial={initial} badUrl={badUrl} reducedMotion={reducedMotion} />,
);
