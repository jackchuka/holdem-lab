import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type { DeckCard } from '../deck';
import { useI18n } from '../i18n/i18n';
import { CardView } from './CardView';

const SWIPE_PX = 50;

export function CardDeck({ cards, active = true }: { cards: DeckCard[]; active?: boolean }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const total = cards.length;

  const move = useCallback(
    (step: 1 | -1) => {
      if (total === 0) return;
      setIndex((i) => (i + step + total) % total);
      setFlipped(false);
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active || e.altKey || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, active]);

  if (total === 0) return <p className="empty">{t('list.empty')}</p>;

  const onPointerDown = (e: PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      swiped.current = true;
      move(dx < 0 ? 1 : -1);
    }
  };
  const onFlip = () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    setFlipped((f) => !f);
  };

  return (
    <>
      {/* A fresh card per index starts face up with no turn back, which would briefly show the next card's answer. */}
      <CardView key={index} card={cards[index]} flipped={flipped} onFlip={onFlip} onPointerDown={onPointerDown} onPointerUp={onPointerUp} />
      <div className="deck-nav">
        <button type="button" onClick={() => move(-1)}>
          <span aria-hidden="true">← </span>
          {t('card.prev')}
        </button>
        <span className="pos" data-testid="position">
          {t('card.position', { n: index + 1, total })}
        </span>
        <button type="button" onClick={() => move(1)}>
          {t('card.next')}
          <span aria-hidden="true"> →</span>
        </button>
      </div>
    </>
  );
}
