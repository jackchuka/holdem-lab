import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { ENTRIES } from './terms';

const KEY = 'holdem-lab:glossary:settings';

// jsdom reports an English browser; pin Japanese so labels match the Japanese copy.
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(KEY, JSON.stringify({ locale: 'ja' }));
});
afterEach(cleanup);

const count = (category: string) => ENTRIES.filter((e) => e.category === category).length;

describe('App', () => {
  it('opens on the cards tab with every term in the deck', () => {
    render(<App />);
    expect(screen.getByRole('tab', { name: 'カード' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('position').textContent).toBe(`1 / ${ENTRIES.length}`);
  });

  it('narrows the deck to a category and starts it from the first card', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '次へ' }));
    fireEvent.click(screen.getByRole('button', { name: 'ポジション' }));
    expect(screen.getByTestId('position').textContent).toBe(`1 / ${count('position')}`);
  });

  it('switches to the list and keeps the category', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'ポジション' }));
    fireEvent.click(screen.getByRole('tab', { name: '一覧' }));
    expect(screen.getByRole('searchbox')).toBeTruthy();
    expect(screen.getAllByRole('button', { expanded: false })).toHaveLength(count('position'));
    expect(document.querySelector('.tag')).toBeNull();
  });

  it('saves the card direction and rebuilds the deck in that direction', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    fireEvent.click(screen.getByRole('button', { name: '日 → 英' }));
    expect(JSON.parse(localStorage.getItem(KEY)!).direction).toBe('ja-en');
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    const first = ENTRIES.find((e) => screen.getByTestId('card-front').textContent!.includes(e.term.ja));
    expect(first).toBeTruthy();
  });

  it('switches the UI language', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('tab', { name: 'List' })).toBeTruthy();
  });
});
