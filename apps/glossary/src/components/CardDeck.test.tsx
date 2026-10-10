import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DeckCard } from '../deck';
import { I18nProvider, createTranslator } from '../i18n/i18n';
import type { Term } from '../terms';
import { CardDeck } from './CardDeck';

afterEach(cleanup);

// jsdom may lack PointerEvent; MouseEvent carries clientX/clientY the same way.
if (!('PointerEvent' in window)) Object.assign(window, { PointerEvent: MouseEvent });

const term = (id: string, en: string, ja: string): Term => ({
  id,
  en,
  ja,
  kana: 'よみ',
  aliases: [],
  def: { ja: `${ja}の説明`, en: `${en} meaning` },
  example: { en: `${en} ex`, ja: `${ja}の例` },
});
const CARDS: DeckCard[] = [
  { direction: 'en-ja', entry: { category: 'action', term: term('3bet', '3-bet', 'スリーベット') } },
  { direction: 'ja-en', entry: { category: 'slang', term: term('nuts', 'Nuts', 'ナッツ') } },
  { direction: 'en-ja', entry: { category: 'math', term: term('spr', 'SPR', 'エスピーアール') } },
];

const renderDeck = (cards = CARDS) =>
  render(
    <I18nProvider value={createTranslator('ja')}>
      <CardDeck cards={cards} />
    </I18nProvider>,
  );
const card = () => screen.getByTestId('card');
const front = () => screen.getByTestId('card-front');
const back = () => screen.getByTestId('card-back');
const pos = () => screen.getByTestId('position').textContent;

describe('CardDeck', () => {
  it('shows the asked side on the front and the answer, definition and examples on the back', () => {
    renderDeck();
    expect(front().textContent).toContain('3-bet');
    expect(back().getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(card());
    expect(card().className).toContain('is-flipped');
    expect(back().getAttribute('aria-hidden')).toBe('false');
    expect(back().textContent).toContain('スリーベット');
    expect(back().textContent).toContain('よみ');
    expect(back().textContent).toContain('スリーベットの説明');
    expect(back().textContent).toContain('3-bet ex');
    expect(back().textContent).toContain('スリーベットの例');
  });

  it('asks in Japanese for ja-en cards and hides the reading on the back', () => {
    renderDeck();
    fireEvent.click(screen.getByRole('button', { name: '次へ' }));
    expect(front().textContent).toContain('ナッツ');
    expect(back().textContent).toContain('Nuts');
    expect(back().textContent).not.toContain('よみ');
  });

  it('moves with buttons, wraps at both ends and returns to the front', () => {
    renderDeck();
    expect(pos()).toBe('1 / 3');
    fireEvent.click(card());
    fireEvent.click(screen.getByRole('button', { name: '次へ' }));
    expect(pos()).toBe('2 / 3');
    expect(card().className).not.toContain('is-flipped');
    fireEvent.click(screen.getByRole('button', { name: '次へ' }));
    fireEvent.click(screen.getByRole('button', { name: '次へ' }));
    expect(pos()).toBe('1 / 3');
    fireEvent.click(screen.getByRole('button', { name: '前へ' }));
    expect(pos()).toBe('3 / 3');
  });

  it('mounts the next card fresh so its answer never shows during the turn back', () => {
    renderDeck();
    fireEvent.click(card());
    const before = card();
    fireEvent.click(screen.getByRole('button', { name: '次へ' }));
    expect(card()).not.toBe(before);
    expect(card().className).not.toContain('is-flipped');
  });

  it('ignores arrow keys while inactive', () => {
    render(
      <I18nProvider value={createTranslator('ja')}>
        <CardDeck cards={CARDS} active={false} />
      </I18nProvider>,
    );
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(pos()).toBe('1 / 3');
  });

  it('moves with arrow keys but not while typing in an input', () => {
    renderDeck();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(pos()).toBe('2 / 3');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(pos()).toBe('1 / 3');
    const input = document.createElement('input');
    document.body.append(input);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(pos()).toBe('1 / 3');
    input.remove();
  });

  it('moves on a horizontal swipe and ignores taps and vertical drags', () => {
    renderDeck();
    const swipe = (dx: number, dy: number) => {
      fireEvent.pointerDown(card(), { clientX: 200, clientY: 300 });
      fireEvent.pointerUp(card(), { clientX: 200 + dx, clientY: 300 + dy });
    };
    swipe(-80, 5);
    expect(pos()).toBe('2 / 3');
    swipe(80, 5);
    expect(pos()).toBe('1 / 3');
    swipe(10, 2);
    expect(pos()).toBe('1 / 3');
    swipe(60, 120);
    expect(pos()).toBe('1 / 3');
  });

  it('does not flip the card at the end of a swipe', () => {
    renderDeck();
    fireEvent.pointerDown(card(), { clientX: 200, clientY: 300 });
    fireEvent.pointerUp(card(), { clientX: 100, clientY: 300 });
    fireEvent.click(card());
    expect(card().className).not.toContain('is-flipped');
  });

  it('shows nothing to flip for an empty deck', () => {
    renderDeck([]);
    expect(screen.queryByTestId('card')).toBeNull();
    expect(screen.getByText('見つかりません')).toBeTruthy();
  });

  describe('slide animation', () => {
    const slide = () => screen.getByTestId('card-slide');
    // jsdom has no matchMedia; stubbing it opts the deck into animations.
    const allowMotion = () =>
      vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    afterEach(() => vi.unstubAllGlobals());

    it('follows the finger while dragging and springs back below the threshold', () => {
      renderDeck();
      fireEvent.pointerDown(card(), { clientX: 200, clientY: 300 });
      fireEvent.pointerMove(card(), { clientX: 170, clientY: 302 });
      expect(slide().style.transform).toContain('translateX(-30px)');
      expect(slide().style.transform).not.toContain('rotate');
      fireEvent.pointerUp(card(), { clientX: 170, clientY: 302 });
      expect(slide().style.transform).toContain('translateX(0px)');
      expect(pos()).toBe('1 / 3');
    });

    it('ignores mostly vertical drags', () => {
      renderDeck();
      fireEvent.pointerDown(card(), { clientX: 200, clientY: 300 });
      fireEvent.pointerMove(card(), { clientX: 190, clientY: 360 });
      expect(slide().style.transform).toContain('translateX(0px)');
    });

    it('slides the card out, swaps it, and slides the next one in', () => {
      allowMotion();
      renderDeck();
      fireEvent.click(screen.getByRole('button', { name: '次へ' }));
      expect(pos()).toBe('1 / 3');
      expect(slide().style.transform).toContain('translateX(-120%)');
      expect(slide().style.transform).not.toContain('rotate');
      fireEvent.transitionEnd(slide());
      expect(pos()).toBe('2 / 3');
      expect(front().textContent).toContain('ナッツ');
      expect(slide().style.transform).toContain('translateX(0px)');
    });

    it('slides the other way for the previous card', () => {
      allowMotion();
      renderDeck();
      fireEvent.click(screen.getByRole('button', { name: '前へ' }));
      expect(slide().style.transform).toContain('translateX(120%)');
      fireEvent.transitionEnd(slide());
      expect(pos()).toBe('3 / 3');
    });

    it('moves at once when the user prefers reduced motion', () => {
      vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
      renderDeck();
      fireEvent.click(screen.getByRole('button', { name: '次へ' }));
      expect(pos()).toBe('2 / 3');
    });
  });
});
