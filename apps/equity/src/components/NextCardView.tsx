import { makeCard, type Card, type EquityStats } from '@holdem-lab/engine';
import { heatColor, nextCardCells, nextCardSummary } from '../analysis';
import { cardLabel } from '../cards';
import { useI18n } from '../i18n/i18n';

const RANK_ORDER = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const pt = (d: number) => `${d >= 0 ? '+' : '−'}${Math.abs(d * 100).toFixed(1)}`;

type Props = { stats: EquityStats; focus: number; boardSize: number; onPlace: (c: Card) => void };

export function NextCardView({ stats, focus, boardSize, onPlace }: Props) {
  const { t } = useI18n();
  if (boardSize !== 3 && boardSize !== 4) return <p className="muted center">{t('next.unavailable')}</p>;
  const cells = new Map(nextCardCells(stats, focus).map((c) => [c.card, c]));
  const summary = nextCardSummary([...cells.values()]);
  return (
    <div className="next-card">
      <div className="next-grid">
        {[0, 1, 2, 3].flatMap((suit) =>
          RANK_ORDER.map((rank) => {
            const card = makeCard(rank, suit);
            const cell = cells.get(card);
            const label = cardLabel(card);
            return (
              <button
                key={card}
                disabled={!cell}
                aria-label={cell ? `${label} ${(cell.equity * 100).toFixed(1)}%` : label}
                style={cell ? { background: heatColor(cell.delta, 0.3), opacity: cell.faded ? 0.45 : 1 } : undefined}
                onClick={() => onPlace(card)}
              >
                {label.slice(0, -1)}
              </button>
            );
          }),
        )}
      </div>
      {summary && (
        <div className="next-summary">
          <span>{t('next.down', { n: summary.down, total: summary.total })}</span>
          <span>{t('next.worst', { card: cardLabel(summary.worst.card), delta: pt(summary.worst.delta) })}</span>
          <span>{t('next.best', { card: cardLabel(summary.best.card), delta: pt(summary.best.delta) })}</span>
        </div>
      )}
    </div>
  );
}
