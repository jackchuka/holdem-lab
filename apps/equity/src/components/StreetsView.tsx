import type { StreetPoint } from '../compute/useEquity';
import { useI18n } from '../i18n/i18n';

const W = 300;
const H = 160;
const L = 30;
const R = 12;
const T = 10;
const B = 24;

export function StreetsView({ streets, players }: { streets: StreetPoint[]; players: number }) {
  const { t } = useI18n();
  if (!streets.length) return <p className="muted center">{t('analysis.empty')}</p>;
  const x = (i: number) => (streets.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (streets.length - 1));
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const anchor = (i: number) =>
    streets.length === 1 ? 'middle' : i === 0 ? 'start' : i === streets.length - 1 ? 'end' : 'middle';
  return (
    <svg className="streets" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('tab.streets')}>
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="streets-grid" />
          <text x={L - 6} y={y(v) + 3} textAnchor="end" className="streets-axis">
            {v * 100}
          </text>
        </g>
      ))}
      {streets.map((s, i) => (
        <text key={s.street} x={x(i)} y={H - 6} textAnchor={anchor(i)} className="streets-axis">
          {t(`street.${s.street}`)}
        </text>
      ))}
      {Array.from({ length: players }, (_, p) => (
        <g key={p} style={{ color: `var(--player-${p + 1})` }}>
          <polyline fill="none" stroke="currentColor" strokeWidth={2.5} points={streets.map((s, i) => `${x(i)},${y(s.equity[p])}`).join(' ')} />
          {streets.map((s, i) => (
            <circle key={i} cx={x(i)} cy={y(s.equity[p])} r={3} fill="currentColor">
              <title>{`${t('player.name', { n: p + 1 })} ${t(`street.${s.street}`)} ${(s.equity[p] * 100).toFixed(1)}%`}</title>
            </circle>
          ))}
        </g>
      ))}
    </svg>
  );
}
