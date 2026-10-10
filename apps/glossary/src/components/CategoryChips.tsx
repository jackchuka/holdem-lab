import type { Filter } from '../deck';
import { useI18n } from '../i18n/i18n';
import { CATEGORIES } from '../terms';

const FILTERS: Filter[] = ['all', ...CATEGORIES];

export function CategoryChips({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const { t } = useI18n();
  return (
    <div className="chips categories" role="group" aria-label={t('categories.label')}>
      {FILTERS.map((f) => (
        <button key={f} type="button" className="chip" aria-pressed={value === f} onClick={() => onChange(f)}>
          {t(`category.${f}`)}
        </button>
      ))}
    </div>
  );
}
