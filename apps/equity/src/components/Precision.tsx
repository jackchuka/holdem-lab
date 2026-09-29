import { summarize } from '@holdem-lab/engine';
import type { EquityView } from '../compute/useEquity';
import { useI18n } from '../i18n/i18n';
import type { Readiness } from '../state';

export function Precision({ view, readiness, onRetry }: { view: EquityView; readiness: Readiness; onRetry: () => void }) {
  const { t } = useI18n();
  if (!readiness.ok) {
    const key =
      readiness.reason === 'incomplete' ? 'precision.incomplete' : readiness.reason === 'board' ? 'precision.boardPartial' : 'player.duplicate';
    return <p className="precision">{t(key)}</p>;
  }
  if (view.status === 'error' && view.error) {
    return (
      <p className="precision precision-error">
        {view.error.noValidPlayer !== undefined ? t('player.noValid') : t('precision.error', { message: view.error.message })}
        <button className="link" onClick={onRetry}>
          {t('precision.retry')}
        </button>
      </p>
    );
  }
  if (!view.stats || (view.mode === 'exact' && view.status !== 'done')) {
    return <p className="precision">{t('precision.running')}</p>;
  }
  if (view.mode === 'exact') return <p className="precision">{t('precision.exact')}</p>;
  const hw = Math.max(...summarize(view.stats).halfWidth);
  return (
    <p className="precision" data-running={view.status === 'running'}>
      {t('precision.mc', { hw: (hw * 100).toFixed(1), n: view.stats.samples.toLocaleString() })}
    </p>
  );
}
