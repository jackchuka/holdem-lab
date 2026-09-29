import { useEffect, useState } from 'react';
import { CATEGORIES, categoryText, type Category } from '@holdem-lab/quiz';
import { useI18n } from '../i18n/i18n';
import { accuracyByCategory, dailyCounts, masteryCounts } from '../stats/stats';
import type { Store } from '../storage/store';
import { DAY_MS } from '../time';

type Data = {
  counts: number[];
  accuracy: Record<Category, { total: number; correct: number }>;
  mastery: { mastered: number; learning: number; unlearned: number };
};

export function Stats({ store, universe }: { store: Store; universe: number }) {
  const { t, text, locale } = useI18n();
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let alive = true;
    const now = Date.now();
    void Promise.all([store.getHistory(now - 30 * DAY_MS), store.getReviews()]).then(([history, reviews]) => {
      if (alive) setData({ counts: dailyCounts(history, now), accuracy: accuracyByCategory(history), mastery: masteryCounts(reviews, universe) });
    });
    return () => {
      alive = false;
    };
  }, [store, universe]);

  if (!data) return <section className="app-main" />;
  const max = Math.max(1, ...data.counts);
  const fmt = (n: number) => n.toLocaleString(locale);
  return (
    <section className="app-main">
      <h1 className="title">{t('stats.title')}</h1>
      <div className="panel">
        <div className="label">{t('stats.last30')}</div>
        <div className="bars">
          {data.counts.map((n, i) => (
            <i key={i} style={{ height: `${(n / max) * 100}%` }} title={t('stats.questions', { n })} />
          ))}
        </div>
      </div>
      {CATEGORIES.map((c) => {
        const a = data.accuracy[c];
        const pct = a.total ? Math.round((a.correct / a.total) * 100) : 0;
        return (
          <div key={c}>
            <div className="row-flat">
              <span>{text(categoryText(c))}</span>
              <span>{a.total ? `${pct}%` : '—'}</span>
            </div>
            <div className="meter">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="label">
        {t('stats.mastery', {
          mastered: fmt(data.mastery.mastered),
          learning: fmt(data.mastery.learning),
          unlearned: fmt(data.mastery.unlearned),
        })}
      </div>
    </section>
  );
}
