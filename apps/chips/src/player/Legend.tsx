import { FINGER_COLORS, PRESS_COLOR } from '../scene/colors';
import { useI18n } from '../i18n/i18n';
import type { FingerId } from '../tricks/types';

export function Legend({ fingers }: { fingers: FingerId[] }) {
  const { t } = useI18n();
  return (
    <ul className="legend">
      {fingers.map((f) => (
        <li key={f}>
          <i style={{ background: FINGER_COLORS[f] }} />
          {t(`finger.${f}`)}
        </li>
      ))}
      <li>
        <i className="press" style={{ borderColor: PRESS_COLOR }} />
        {t('legend.press')}
      </li>
    </ul>
  );
}
