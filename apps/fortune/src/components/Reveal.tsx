import { useEffect, useState } from 'react';
import { PlayingCard } from '@holdem-lab/ui';
import type { Fortune } from '../fortune';

export const REVEAL_STEP_MS = 450;
export type Phase = 'idle' | 'revealing' | 'done';

const VISIBLE_BOARD = [0, 3, 4, 5];

function Back({ size }: { size: 'md' | 'lg' }) {
  return <div className={`hl-card hl-card--${size} card-back`} data-testid="card-back" />;
}

export function Reveal({ fortune, phase, onDone }: { fortune: Fortune; phase: Phase; onDone: () => void }) {
  const [stage, setStage] = useState(phase === 'done' ? 4 : 0);

  useEffect(() => {
    if (phase === 'idle') setStage(0);
    if (phase === 'done') setStage(4);
    if (phase !== 'revealing') return;
    setStage(0);
    let s = 0;
    const timer = setInterval(() => {
      s += 1;
      setStage(s);
      if (s === 4) {
        clearInterval(timer);
        onDone();
      }
    }, REVEAL_STEP_MS);
    return () => clearInterval(timer);
  }, [phase, fortune, onDone]);

  const dim = (c: number) => stage === 4 && !fortune.bestFive.includes(c);
  return (
    <div className="reveal">
      <div className="zone-label">YOUR HAND</div>
      <div className="card-row">
        {fortune.hand.map((c) =>
          stage >= 1 ? (
            <span key={c} className={dim(c) ? 'dim' : undefined}>
              <PlayingCard card={c} size="lg" />
            </span>
          ) : (
            <Back key={c} size="lg" />
          ),
        )}
      </div>
      <div className="zone-label">BOARD</div>
      <div className="card-row">
        {fortune.board.map((c, i) =>
          i < VISIBLE_BOARD[Math.max(0, stage - 1)] ? (
            <span key={c} className={dim(c) ? 'dim' : undefined}>
              <PlayingCard card={c} size="md" />
            </span>
          ) : (
            <Back key={c} size="md" />
          ),
        )}
      </div>
    </div>
  );
}
