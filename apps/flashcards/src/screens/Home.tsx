import { useEffect, useState } from 'react';
import { categoryText, type Category } from '@holdem-lab/quiz';
import { HomeLink } from '@holdem-lab/ui';
import { useI18n } from '../i18n/i18n';
import { computeStreak } from '../stats/stats';
import type { Store } from '../storage/store';
import { DAY_MS, startOfDay } from '../time';
import type { Settings } from '../types';

const SIZES = [10, 20, 50];

type Props = {
  store: Store;
  settings: Settings;
  available: Category[];
  onSettings: (s: Settings) => void;
  onStart: () => void;
};

export function Home({ store, settings, available, onSettings, onStart }: Props) {
  const { t, text } = useI18n();
  const [info, setInfo] = useState({ due: 0, newRemaining: settings.newPerDay, streak: 0 });

  useEffect(() => {
    let alive = true;
    const now = Date.now();
    void Promise.all([store.getReviews(), store.getHistory(now - 400 * DAY_MS)]).then(([reviews, history]) => {
      if (!alive) return;
      const newToday = history.filter((h) => h.kind === 'new' && h.at >= startOfDay(now)).length;
      setInfo({
        due: reviews.filter((r) => r.due <= now).length,
        newRemaining: Math.max(0, settings.newPerDay - newToday),
        streak: computeStreak(history, now),
      });
    });
    return () => {
      alive = false;
    };
  }, [store, settings.newPerDay]);

  const selected = settings.categories.filter((c) => available.includes(c));
  const toggle = (c: Category) =>
    onSettings({
      ...settings,
      categories: settings.categories.includes(c) ? settings.categories.filter((x) => x !== c) : [...settings.categories, c],
    });

  return (
    <section className="app-main">
      <div className="brand">
        <HomeLink href={__HOME_LINK__} />
        <h1 className="title brand">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          Flashcards
        </h1>
      </div>
      <div className="panel stats-row">
        <div>
          <div className="label">{t('home.due')}</div>
          <div className="big">{info.due}</div>
        </div>
        <div>
          <div className="label">{t('home.new')}</div>
          <div className="mid">{info.newRemaining}</div>
        </div>
        <div>
          <div className="label">{t('home.streak')}</div>
          <div className="mid">🔥{info.streak}</div>
        </div>
      </div>
      <div className="label">{t('home.categories')}</div>
      <div className="chips">
        {available.map((c) => (
          <button key={c} className="chip" aria-pressed={selected.includes(c)} onClick={() => toggle(c)}>
            {text(categoryText(c))}
          </button>
        ))}
      </div>
      <div className="label">{t('home.size')}</div>
      <div className="chips">
        {SIZES.map((n) => (
          <button key={n} className="chip" aria-pressed={settings.sessionSize === n} onClick={() => onSettings({ ...settings, sessionSize: n })}>
            {n}
          </button>
        ))}
      </div>
      <div className="spacer" />
      <button className="primary" disabled={selected.length === 0} onClick={onStart}>
        {t('home.start')}
      </button>
    </section>
  );
}
