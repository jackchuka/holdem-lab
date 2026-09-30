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

  it('renders a rank-only pattern in the neutral color', () => {
    const { container } = render(<PlayingCard pattern={{ rank: 8, suit: null }} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('data-pattern')).toBe('T');
    expect(svg.getAttribute('aria-label')).toBe('T');
    expect(container.textContent).toBe('10');
    expect(svg.querySelector('text')!.getAttribute('fill')).toBe('var(--suit-s)');
  });

  it('renders a suit-only pattern as x in the suit color', () => {
    const { container } = render(<PlayingCard pattern={{ rank: null, suit: 1 }} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('data-pattern')).toBe('x♥');
    expect(container.textContent).toBe('x♥');
    expect(svg.querySelector('text')!.getAttribute('fill')).toBe('var(--suit-h)');
  });

  it('renders an any-card pattern as x', () => {
    const { container } = render(<PlayingCard pattern={{ rank: null, suit: null }} />);
    expect(container.querySelector('svg')!.getAttribute('data-pattern')).toBe('x');
    expect(container.textContent).toBe('x');
  });

  it('renders a fully specified pattern as a normal card', () => {
    const { container } = render(<PlayingCard pattern={{ rank: 12, suit: 0 }} />);
    expect(container.querySelector('svg')!.getAttribute('data-card')).toBe('As');
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

  it('renders two empty slots without cards', () => {
    const { container } = render(<HeroHand cards={[]} />);
    const hero = container.querySelector('[data-testid="hero"]')!;
    expect(hero.querySelectorAll('[data-testid="card-slot"].hl-card--lg')).toHaveLength(2);
  });

  it('renders a pattern instead of cards', () => {
    const { container } = render(
      <HeroHand
        cards={[]}
        pattern={[
          { rank: 12, suit: 1 },
          { rank: null, suit: 1 },
        ]}
      />,
    );
    const hero = container.querySelector('[data-testid="hero"]')!;
    expect(hero.querySelectorAll('svg.hl-card--lg')).toHaveLength(2);
    expect(hero.querySelector('[data-pattern="x♥"]')).not.toBeNull();
  });
});
