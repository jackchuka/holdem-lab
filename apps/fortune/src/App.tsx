import { useCallback, useEffect, useMemo, useState } from 'react';
import { RANKS, cardsToString, rankOf, suitOf } from '@holdem-lab/engine';
import { HomeLink } from '@holdem-lab/ui';
import { NamePanel } from './components/NamePanel';
import { Result } from './components/Result';
import { Reveal, type Phase } from './components/Reveal';
import { Toast } from './components/Toast';
import { computeFortune, type Fortune, type FortuneKey } from './fortune';
import { I18nProvider, categoryName, createTranslator, formatDate } from './i18n/i18n';
import type { UiKey } from './i18n/messages';
import { COMMENTS } from './i18n/texts';
import { loadSettings, saveSettings, THEMES } from './settings';
import { downloadBlob, shareFortune, type ShareNavigator } from './share';
import { renderShareImage } from './shareImage';
import { myKey, type FortuneStore } from './store';
import { shareUrl } from './url';

export type View = { key: FortuneKey; date: string; source: 'mine' | 'name' | 'shared' };
type Props = {
  store: FortuneStore;
  today: () => string;
  initial: View;
  badUrl: boolean;
  reducedMotion: boolean;
  nav?: ShareNavigator;
  open?: (url: string) => void;
};

const GLYPHS = ['♠', '♥', '♦', '♣'];
const cardText = (c: number) => RANKS[rankOf(c)] + GLYPHS[suitOf(c)];

export function App({ store, today: getToday, initial, badUrl, reducedMotion, nav = navigator, open = (u) => window.open(u, '_blank', 'noopener') }: Props) {
  const [settings, setSettings] = useState(loadSettings);
  const [today, setToday] = useState(getToday);
  const [prepared, setPrepared] = useState<{ fortune: Fortune; blob: Blob | null } | null>(null);
  const [view, setView] = useState(initial);
  const [phase, setPhase] = useState<Phase>(initial.source !== 'mine' || store.seenToday(initial.date) ? 'done' : 'idle');
  const [savedName, setSavedName] = useState(store.savedName);
  const [editing, setEditing] = useState(false);
  const [image, setImage] = useState<Blob | null>(null);
  const [toast, setToast] = useState<UiKey | null>(badUrl ? 'toast.badUrl' : null);
  const translator = useMemo(() => createTranslator(settings.locale), [settings.locale]);
  const { t, locale } = translator;
  const fortune = useMemo(() => computeFortune(view.key, view.date), [view]);
  const clearToast = useCallback(() => setToast(null), []);
  const onRevealed = useCallback(() => setPhase('done'), []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = settings.locale;
    root.dataset.theme = settings.theme;
    root.dataset.fourColor = String(settings.fourColor);
    document.title = t('app.title');
    saveSettings(settings);
  }, [settings, t]);

  useEffect(() => {
    const check = () => setToday(getToday());
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [getToday]);

  useEffect(() => {
    if (view.source !== 'mine' || view.date === today) return;
    setView({ key: myKey(store), date: today, source: 'mine' });
    setPhase(store.seenToday(today) ? 'done' : 'idle');
    setImage(null);
  }, [today, view, store]);

  const tierLabel = t(`tier.${fortune.tier}`);
  const handLabel = categoryName(fortune.category, locale);
  const comment = COMMENTS[locale][fortune.tier][fortune.commentIndex];
  const imageLabels = useMemo(
    () => ({
      tier: tierLabel,
      hand: handLabel,
      date: view.date.replaceAll('-', '/'),
      comment,
      handPower: t('image.handPower'),
      lucky: [t('lucky.position'), t('lucky.suit'), t('lucky.size')] as [string, string, string],
    }),
    [tierLabel, handLabel, view.date, comment, t],
  );

  useEffect(() => {
    if (phase !== 'done') return;
    let live = true;
    void renderShareImage(fortune, imageLabels).then((blob) => {
      if (live) setPrepared({ fortune, blob });
    });
    return () => {
      live = false;
    };
  }, [phase, fortune, imageLabels]);

  const dropShareParams = () => history.replaceState(null, '', location.pathname);
  const goMine = () => {
    dropShareParams();
    setView({ key: myKey(store), date: today, source: 'mine' });
    setPhase(store.seenToday(today) ? 'done' : 'idle');
    setImage(null);
  };
  const reveal = () => {
    store.markSeen(today);
    setPhase(reducedMotion ? 'done' : 'revealing');
  };
  const readName = (name: string) => {
    dropShareParams();
    setView({ key: { kind: 'name', name }, date: today, source: 'name' });
    setPhase(reducedMotion ? 'done' : 'revealing');
    setImage(null);
  };
  const saveName = (name: string) => {
    dropShareParams();
    store.setSavedName(name);
    setSavedName(store.savedName());
    setEditing(false);
    setView({ key: myKey(store), date: today, source: 'mine' });
    setPhase('done');
    setImage(null);
  };
  const clearName = () => {
    dropShareParams();
    store.setSavedName(null);
    setSavedName(null);
    setEditing(false);
    setView({ key: myKey(store), date: today, source: 'mine' });
    setPhase(store.seenToday(today) ? 'done' : 'idle');
    setImage(null);
  };

  const share = async () => {
    const img = prepared?.fortune === fortune ? prepared.blob : await renderShareImage(fortune, imageLabels);
    const outcome = await shareFortune(
      {
        text: t('share.text', { tier: tierLabel, hand: handLabel, cards: fortune.hand.map(cardText).join('') }),
        url: shareUrl(location.origin + location.pathname, view.key, view.date),
        image: img,
      },
      { nav, open },
    );
    if (outcome === 'fallback') setImage(img);
  };

  const date = formatDate(view.date, locale);
  const heading =
    view.source === 'mine'
      ? t('view.mine', { date })
      : view.key.kind === 'name'
        ? t('view.named', { name: view.key.name, date })
        : t('view.shared', { date });
  const nameView = view.source !== 'mine' && view.key.kind === 'name' ? view.key : null;
  const equityHref = `${__APP_LINKS__.equity}?b=${cardsToString(fortune.board)}&p=${cardsToString(fortune.hand)}&p=x`;
  const nextTheme = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length];

  return (
    <I18nProvider value={translator}>
      <main className="app">
        <header className="app-header">
          <HomeLink href={__HOME_LINK__} />
          <img src="icon.svg" alt="" />
          <h1>{t('app.title')}</h1>
          <span className="spacer" />
          <button className="chip" onClick={() => setSettings({ ...settings, locale: locale === 'ja' ? 'en' : 'ja' })}>
            {t('settings.language')}
          </button>
          <button
            className="chip"
            aria-label={t('settings.theme', { name: t(`theme.${settings.theme}`) })}
            onClick={() => setSettings({ ...settings, theme: nextTheme })}
          >
            {t(`theme.${settings.theme}`)}
          </button>
          <button
            className="chip"
            aria-label={t('settings.fourColor')}
            aria-pressed={settings.fourColor}
            onClick={() => setSettings({ ...settings, fourColor: !settings.fourColor })}
          >
            {t('settings.fourColorShort')}
          </button>
        </header>

        <p className={view.source === 'mine' ? 'heading' : 'heading heading--other'}>{heading}</p>
        <Reveal fortune={fortune} phase={phase} onDone={onRevealed} />

        {phase === 'idle' && (
          <button className="primary" onClick={reveal}>
            {t('reveal.button')}
          </button>
        )}

        {phase === 'done' && (
          <>
            <Result fortune={fortune} />
            {view.source === 'shared' && (
              <button className="primary" onClick={goMine}>
                {t('action.seeMine')}
              </button>
            )}
            <button className={view.source === 'shared' ? 'secondary' : 'primary'} onClick={share}>
              {t('action.share')}
            </button>
            {image && (
              <button className="secondary" onClick={() => downloadBlob(image, 'holdem-lab-fortune.png')}>
                {t('action.saveImage')}
              </button>
            )}
            <div className="actions">
              <a className="secondary" href={equityHref}>
                {t('action.equity')}
              </a>
              <a className="secondary" href={__APP_LINKS__.flashcards}>
                {t('action.flashcards')}
              </a>
            </div>
            {nameView && (
              <div className="actions">
                {nameView.name !== savedName && (
                  <button className="secondary" onClick={() => saveName(nameView.name)}>
                    {t('name.saveAsMine')}
                  </button>
                )}
                {view.source === 'name' && (
                  <button className="secondary" onClick={goMine}>
                    {t('action.backToMine')}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        <NamePanel
          savedName={savedName}
          editing={editing}
          onRead={readName}
          onSave={saveName}
          onEdit={() => setEditing(true)}
          onClear={clearName}
        />
        {toast && <Toast message={t(toast)} onDone={clearToast} />}
      </main>
    </I18nProvider>
  );
}
