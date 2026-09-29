import { CATEGORIES, categoryText } from '@holdem-lab/quiz';
import { useI18n } from '../i18n/i18n';
import type { SessionSummary } from '../session/runner';

type Props = { summary: SessionSummary; onRetryWeak: (itemKeys: string[]) => void; onHome: () => void };

export function Summary({ summary, onRetryWeak, onHome }: Props) {
  const { t, text } = useI18n();
  const rate = summary.total ? Math.round((summary.correct / summary.total) * 100) : 0;
  const sec = Math.round(summary.durationMs / 1000);
  return (
    <main className="app">
      <section className="app-main">
        <h1 className="title center">{t('summary.title')}</h1>
        <div className="panel center">
          <div className="big">
            {summary.correct}
            <small> / {summary.total}</small>
          </div>
          <div className="label">{t('summary.rate', { rate, min: Math.floor(sec / 60), sec: sec % 60 })}</div>
        </div>
        <div className="label">{t('summary.byCategory')}</div>
        {CATEGORIES.filter((c) => summary.byCategory[c]).map((c) => (
          <div key={c} className="row">
            <span>{text(categoryText(c))}</span>
            <span>
              {summary.byCategory[c]!.correct}/{summary.byCategory[c]!.total}
            </span>
          </div>
        ))}
        {summary.weak.length > 0 && (
          <>
            <div className="label">{t('summary.weak')}</div>
            <div className="chips">
              {summary.weak.map((w) => (
                <span key={w.itemKey} className="chip">
                  {text(w.label)}
                </span>
              ))}
            </div>
          </>
        )}
        <div className="spacer" />
        <button className="primary" disabled={summary.weak.length === 0} onClick={() => onRetryWeak(summary.weak.map((w) => w.itemKey))}>
          {t('summary.retry')}
        </button>
        <button className="secondary" onClick={onHome}>
          {t('summary.home')}
        </button>
      </section>
    </main>
  );
}
