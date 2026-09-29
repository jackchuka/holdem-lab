import { useI18n } from '../i18n/i18n';

export type Tab = 'home' | 'stats' | 'settings';

const TABS = ['home', 'stats', 'settings'] as const;

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const { t } = useI18n();
  return (
    <nav className="tabbar">
      {TABS.map((id) => (
        <button key={id} aria-current={id === tab ? 'page' : undefined} onClick={() => onChange(id)}>
          {t(`tab.${id}`)}
        </button>
      ))}
    </nav>
  );
}
