import { useState } from 'react';
import type { Locale } from '@holdem-lab/quiz';
import type { RangeSet } from '@holdem-lab/ranges';
import { useI18n } from '../i18n/i18n';
import { parseExport, type Store } from '../storage/store';
import type { Settings, ThemeName } from '../types';

const THEMES: { name: ThemeName; background: string; color: string }[] = [
  { name: 'felt', background: 'radial-gradient(#1f6b45, #0d3b26)', color: '#f3ecd8' },
  { name: 'dark', background: '#0f1115', color: '#e6e8ee' },
  { name: 'light', background: '#f7f6f2', color: '#1c1c1e' },
  { name: 'midnight', background: 'linear-gradient(160deg, #1a1440, #0b0b1f)', color: '#ece8ff' },
];

const LANGUAGES: { locale: Locale; label: string }[] = [
  { locale: 'ja', label: '日本語' },
  { locale: 'en', label: 'English' },
];

type Props = {
  store: Store;
  settings: Settings;
  rangeSet: RangeSet | null;
  onSettings: (s: Settings) => void;
  onImported: () => void;
};

export function SettingsScreen({ store, settings, rangeSet, onSettings, onImported }: Props) {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);

  const exportData = async () => {
    const blob = new Blob([JSON.stringify(await store.exportAll())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `holdem-lab-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      await store.importAll(parseExport(JSON.parse(await file.text())));
      setMessage(t('settings.imported'));
      onImported();
    } catch (e) {
      setMessage(t('settings.importFailed', { error: (e as Error).message }));
    }
  };

  return (
    <section className="app-main">
      <h1 className="title">{t('settings.title')}</h1>
      <label className="row">
        <span>{t('settings.language')}</span>
        <select value={settings.locale} onChange={(e) => onSettings({ ...settings, locale: e.target.value as Locale })}>
          {LANGUAGES.map((l) => (
            <option key={l.locale} value={l.locale}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <div className="label">{t('settings.theme')}</div>
      <div className="swatches">
        {THEMES.map((th) => (
          <button
            key={th.name}
            className="swatch"
            aria-pressed={settings.theme === th.name}
            style={{ background: th.background, color: th.color }}
            onClick={() => onSettings({ ...settings, theme: th.name })}
          >
            {t(`theme.${th.name}`)}
          </button>
        ))}
      </div>
      <label className="row">
        <span>{t('settings.fourColor')}</span>
        <input type="checkbox" checked={settings.fourColor} onChange={(e) => onSettings({ ...settings, fourColor: e.target.checked })} />
      </label>
      <label className="row">
        <span>{t('settings.newPerDay')}</span>
        <select value={settings.newPerDay} onChange={(e) => onSettings({ ...settings, newPerDay: Number(e.target.value) })}>
          {[10, 20, 30, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="row">
        <span>{t('settings.tolerance')}</span>
        <select value={settings.tolerance} onChange={(e) => onSettings({ ...settings, tolerance: Number(e.target.value) })}>
          {[3, 5, 10].map((n) => (
            <option key={n} value={n}>
              ±{n}%
            </option>
          ))}
        </select>
      </label>
      <div className="row">
        <span>{t('settings.rangeSet')}</span>
        <span>{rangeSet?.name ?? t('settings.rangeMissing')}</span>
      </div>
      <button className="row row-button" onClick={exportData}>
        <span>{t('settings.export')}</span>
        <span>›</span>
      </button>
      <label className="row row-button">
        <span>{t('settings.import')}</span>
        <span>›</span>
        <input
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importData(f);
            e.target.value = '';
          }}
        />
      </label>
      {message && <div className="label">{message}</div>}
    </section>
  );
}
