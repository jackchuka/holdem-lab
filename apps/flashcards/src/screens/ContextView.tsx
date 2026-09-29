import type { Context } from '@holdem-lab/quiz';
import { PlayingCard } from '@holdem-lab/ui';
import { useI18n } from '../i18n/i18n';

const SEATS: { name: string; left: string; top: string }[] = [
  { name: 'UTG', left: '0%', top: '50%' },
  { name: 'HJ', left: '25%', top: '0%' },
  { name: 'CO', left: '75%', top: '0%' },
  { name: 'BTN', left: '100%', top: '50%' },
  { name: 'SB', left: '75%', top: '100%' },
  { name: 'BB', left: '25%', top: '100%' },
];

export function ContextView({ context }: { context: Context }) {
  const { t, text } = useI18n();
  switch (context.kind) {
    case 'villain':
      return (
        <>
          <span className="zone-label">VILLAIN{context.label ? ` · ${text(context.label)}` : ''}</span>
          <div className="hl-row">
            {context.cards.map((c, i) => (
              <PlayingCard key={i} card={c} />
            ))}
          </div>
        </>
      );
    case 'position':
      return (
        <div className="table" aria-label={t('stage.position', { pos: context.position })}>
          {SEATS.map((s) => (
            <span key={s.name} className={`seat${s.name === context.position ? ' me' : ''}`} style={{ left: s.left, top: s.top }}>
              {s.name}
            </span>
          ))}
        </div>
      );
    case 'pot':
      return (
        <div className="pot">
          <div>
            <small>POT</small>
            <b>{context.pot}</b>
          </div>
          <div>
            <small>BET</small>
            <b className="bet">{context.bet}</b>
          </div>
        </div>
      );
  }
}
