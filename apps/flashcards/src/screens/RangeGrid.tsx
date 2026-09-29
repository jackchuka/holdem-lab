import { HAND_CLASSES } from '@holdem-lab/engine';
import { useI18n } from '../i18n/i18n';

export function RangeGrid({ raise, highlight }: { raise: Record<string, number>; highlight: string }) {
  const { t } = useI18n();
  return (
    <div className="range-grid" aria-label={t('result.rangeGrid')}>
      {HAND_CLASSES.map((hc) => {
        const r = raise[hc] ?? 0;
        const cls = [r === 1 ? 'in' : r > 0 ? 'mixed' : '', hc === highlight ? 'hl' : ''].filter(Boolean).join(' ');
        return <div key={hc} className={cls} title={hc} />;
      })}
    </div>
  );
}
