import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type TransitionEvent } from 'react';
import type { DeckCard } from '../deck';
import { useI18n } from '../i18n/i18n';
import { CardView } from './CardView';

const SWIPE_PX = 50;
const SLIDE = 'transform 0.2s ease-out';
// transitionend never fires in a hidden tab, so each phase also ends on a timer.
const PHASE_TIMEOUT_MS = 400;

type Step = 1 | -1;
type Slide = { phase: 'idle' } | { phase: 'out' | 'enter' | 'in'; step: Step };

const motionAllowed = () => typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function CardDeck({ cards, active = true }: { cards: DeckCard[]; active?: boolean }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const [slide, setSlide] = useState<Slide>({ phase: 'idle' });
  const slideEl = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const total = cards.length;

  const swap = useCallback(
    (step: Step) => {
      setIndex((i) => (i + step + total) % total);
      setFlipped(false);
    },
    [total],
  );

  const move = useCallback(
    (step: Step) => {
      if (total === 0 || slide.phase !== 'idle') return;
      if (motionAllowed()) setSlide({ phase: 'out', step });
      else swap(step);
    },
    [total, slide.phase, swap],
  );

  const advance = useCallback(() => {
    if (slide.phase === 'out') {
      swap(slide.step);
      setSlide({ phase: 'enter', step: slide.step });
    } else if (slide.phase === 'in') {
      setSlide({ phase: 'idle' });
    }
  }, [slide, swap]);

  // The next card is placed off the other edge with no transition; reading layout commits that
  // position before it slides in.
  useLayoutEffect(() => {
    if (slide.phase !== 'enter') return;
    void slideEl.current?.offsetWidth;
    setSlide({ phase: 'in', step: slide.step });
  }, [slide]);

  useEffect(() => {
    if (slide.phase !== 'out' && slide.phase !== 'in') return;
    const timer = window.setTimeout(advance, PHASE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [slide.phase, advance]);

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
    if (slide.phase !== 'idle') return;
    start.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
    // jsdom has no pointer capture.
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    setDrag(Math.abs(dx) > Math.abs(dy) ? dx : 0);
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    setDrag(null);
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      swiped.current = true;
      move(dx < 0 ? 1 : -1);
    }
  };
  const onPointerCancel = () => {
    start.current = null;
    setDrag(null);
  };
  const onFlip = () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    setFlipped((f) => !f);
  };
  const onTransitionEnd = (e: TransitionEvent) => {
    // The card's own flip transition bubbles up here too.
    if (e.target === e.currentTarget) advance();
  };

  let transform = 'translateX(0px)';
  let transition = SLIDE;
  if (drag !== null) {
    transform = `translateX(${drag}px)`;
    transition = 'none';
  } else if (slide.phase === 'out') {
    transform = `translateX(${-slide.step * 120}%)`;
  } else if (slide.phase === 'enter') {
    transform = `translateX(${slide.step * 120}%)`;
    transition = 'none';
  }

  return (
    <>
      <div ref={slideEl} className="slide" data-testid="card-slide" style={{ transform, transition }} onTransitionEnd={onTransitionEnd}>
        {/* A fresh card per index starts face up with no turn back, which would briefly show the next card's answer. */}
        <CardView
          key={index}
          card={cards[index]}
          flipped={flipped}
          onFlip={onFlip}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
      </div>
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
