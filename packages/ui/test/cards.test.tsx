import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseCards } from '@holdem-lab/engine';
import { BoardRow, HeroHand, PlayingCard } from '../src';

describe('PlayingCard', () => {
  it('renders rank and suit', () => {
    const { container } = render(<PlayingCard card={parseCards('As')[0]} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-label')).toBe('A♠');
    expect(svg.getAttribute('data-card')).toBe('As');
  });

  it('shows ten as 10', () => {
    const { container } = render(<PlayingCard card={parseCards('Th')[0]} />);
    expect(container.textContent).toContain('10');
  });

  it('renders an empty slot without a card', () => {
    const { container } = render(<PlayingCard />);
    expect(container.querySelector('[data-testid="card-slot"]')).not.toBeNull();
  });
});

describe('BoardRow', () => {
  it('always renders five slots', () => {
    const { container } = render(<BoardRow cards={parseCards('9s8h2s')} />);
    const board = container.querySelector('[data-testid="board"]')!;
    expect(board.querySelectorAll('svg')).toHaveLength(3);
    expect(board.querySelectorAll('[data-testid="card-slot"]')).toHaveLength(2);
  });

  it('renders five empty slots preflop', () => {
    const { container } = render(<BoardRow cards={[]} />);
    expect(container.querySelectorAll('[data-testid="card-slot"]')).toHaveLength(5);
  });
});

describe('HeroHand', () => {
  it('renders two large cards', () => {
    const { container } = render(<HeroHand cards={parseCards('AsKs')} />);
    const hero = container.querySelector('[data-testid="hero"]')!;
    expect(hero.querySelectorAll('svg.hl-card--lg')).toHaveLength(2);
  });
});
