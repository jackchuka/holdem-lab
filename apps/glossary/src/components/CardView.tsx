import type { PointerEventHandler } from 'react';
import type { DeckCard } from '../deck';
import { useI18n } from '../i18n/i18n';
import { Example } from './Example';

type Props = {
  card: DeckCard;
  flipped: boolean;
  onFlip: () => void;
  onPointerDown?: PointerEventHandler;
  onPointerUp?: PointerEventHandler;
};

export function CardView({ card, flipped, onFlip, onPointerDown, onPointerUp }: Props) {
  const { t, locale } = useI18n();
  const { term, category } = card.entry;
  const enFirst = card.direction === 'en-ja';
  const asked = enFirst ? term.en : term.ja;
  const answer = enFirst ? term.ja : term.en;
  return (
    <button
      type="button"
      data-testid="card"
      className={flipped ? 'flip is-flipped' : 'flip'}
      onClick={onFlip}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <span className="flipper">
        <span className="face face-front" data-testid="card-front" aria-hidden={flipped}>
          <span className="cat">{t(`category.${category}`)}</span>
          <span className="term" lang={enFirst ? 'en' : 'ja'}>
            {asked}
          </span>
          <span className="hint">{t('card.hint')}</span>
        </span>
        <span className="face face-back" data-testid="card-back" aria-hidden={!flipped}>
          <span className="asked" lang={enFirst ? 'en' : 'ja'}>
            {asked}
          </span>
          <span className="answer" lang={enFirst ? 'ja' : 'en'}>
            {answer}
          </span>
          {enFirst && <span className="kana">{term.kana}</span>}
          <span className="def">{term.def[locale]}</span>
          <Example term={term} />
        </span>
      </span>
    </button>
  );
}
