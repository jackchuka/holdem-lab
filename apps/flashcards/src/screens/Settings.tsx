import { useState, type ReactNode } from 'react';
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

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="group-title">{title}</h2>
      <div className="settings-group">{children}</div>
    </section>
  );
}

function ChipRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="row">
      <span>{label}</span>
      <div className="chips">
        {options.map((o) => (
          <button key={o.value} className="chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsScreen({ store, settings, rangeSet, onSettings, onImported }: Props) {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);

  const exportData = async () => {
    const blob = new Blob([JSON.stringify(await store.exportAll())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `flashcards-${new Date().toISOString().slice(0, 10)}.json`;
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

  const reset = async (kind: 'stats' | 'all') => {
    if (!window.confirm(t(kind === 'stats' ? 'settings.resetStatsConfirm' : 'settings.resetAllConfirm'))) return;
    try {
      await (kind === 'stats' ? store.clearHistory() : store.clearProgress());
      setMessage(t('settings.resetDone'));
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  return (
    <section className="app-main">
      <h1 className="title">{t('settings.title')}</h1>

      <Group title={t('settings.display')}>
        <ChipRow
          label={t('settings.language')}
          options={LANGUAGES.map((l) => ({ value: l.locale, label: l.label }))}
          value={settings.locale}
          onChange={(locale) => onSettings({ ...settings, locale })}
        />
        <div className="row row-stack">
          <span>{t('settings.theme')}</span>
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
        </div>
        <div className="row">
          <span>{t('settings.fourColor')}</span>
          <button
            className="switch"
            role="switch"
            aria-checked={settings.fourColor}
            aria-label={t('settings.fourColor')}
            onClick={() => onSettings({ ...settings, fourColor: !settings.fourColor })}
          />
        </div>
      </Group>

      <Group title={t('settings.study')}>
        <ChipRow
          label={t('settings.newPerDay')}
          options={[10, 20, 30, 50].map((n) => ({ value: n, label: String(n) }))}
          value={settings.newPerDay}
          onChange={(newPerDay) => onSettings({ ...settings, newPerDay })}
        />
        <ChipRow
          label={t('settings.tolerance')}
          options={[3, 5, 10].map((n) => ({ value: n, label: `±${n}%` }))}
          value={settings.tolerance}
          onChange={(tolerance) => onSettings({ ...settings, tolerance })}
        />
        <div className="row">
          <span>{t('settings.rangeSet')}</span>
          <span className="muted">{rangeSet?.name ?? t('settings.rangeMissing')}</span>
        </div>
      </Group>

      <Group title={t('settings.data')}>
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
        <button className="row row-button" onClick={() => void reset('stats')}>
          <span>{t('settings.resetStats')}</span>
          <span>›</span>
        </button>
        <button className="row row-button danger" onClick={() => void reset('all')}>
          <span>{t('settings.resetAll')}</span>
          <span>›</span>
        </button>
      </Group>

      {message && (
        <div className="label" role="status">
          {message}
        </div>
      )}
    </section>
  );
}
