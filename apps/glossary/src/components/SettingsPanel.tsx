import { useI18n } from '../i18n/i18n';
import { DIRECTIONS, THEMES, type Settings } from '../settings';

const LANGUAGES = [
  { locale: 'ja', label: '日本語' },
  { locale: 'en', label: 'English' },
] as const;

export function SettingsPanel({ settings, onChange }: { settings: Settings; onChange: (s: Settings) => void }) {
  const { t } = useI18n();
  return (
    <div className="editor">
      <div className="setting">
        <span>{t('settings.direction')}</span>
        <div className="chips">
          {DIRECTIONS.map((direction) => (
            <button key={direction} className="chip" aria-pressed={settings.direction === direction} onClick={() => onChange({ ...settings, direction })}>
              {t(`direction.${direction}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="setting">
        <span>{t('settings.language')}</span>
        <div className="chips">
          {LANGUAGES.map((l) => (
            <button key={l.locale} className="chip" aria-pressed={settings.locale === l.locale} onClick={() => onChange({ ...settings, locale: l.locale })}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div className="setting">
        <span>{t('settings.theme')}</span>
        <div className="chips">
          {THEMES.map((theme) => (
            <button key={theme} className="chip" aria-pressed={settings.theme === theme} onClick={() => onChange({ ...settings, theme })}>
              {t(`theme.${theme}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
