import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { parseCard, type HandClass } from '@holdem-lab/engine';
import { CardPicker, RangeGrid } from '../src';

describe('CardPicker', () => {
  it('lists 52 cards, disables used ones and reports picks', () => {
    const onPick = vi.fn();
    render(<CardPicker disabled={new Set([parseCard('As')])} selected={new Set([parseCard('Th')])} onPick={onPick} />);
    expect(screen.getAllByRole('button')).toHaveLength(52);
    expect(screen.getByRole('button', { name: 'A♠' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: '10♥' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'K♦' }));
    expect(onPick).toHaveBeenCalledWith(parseCard('Kd'));
  });
});

function Harness({ initial, spy }: { initial: [HandClass, number][]; spy: (m: Map<HandClass, number>) => void }) {
  const [range, setRange] = useState(new Map(initial));
  return (
    <RangeGrid
      range={range}
      onChange={(next) => {
        setRange(next);
        spy(next);
      }}
    />
  );
}

const cell = (c: HTMLElement, hc: string) => c.querySelector(`[data-hc="${hc}"]`)!;

describe('RangeGrid', () => {
  it('paints every cell crossed during a drag', () => {
    const spy = vi.fn();
    const { container } = render(<Harness initial={[]} spy={spy} />);
    fireEvent.pointerDown(cell(container, 'AA'));
    fireEvent.pointerEnter(cell(container, 'KK'));
    fireEvent.pointerEnter(cell(container, 'QQ'));
    fireEvent.pointerUp(window);
    fireEvent.pointerEnter(cell(container, 'JJ'));
    expect([...spy.mock.lastCall![0].keys()].sort((a, b) => a.localeCompare(b))).toEqual(['AA', 'KK', 'QQ']);
    expect(cell(container, 'KK').getAttribute('data-state')).toBe('in');
  });

  it('erases when the drag starts on a selected cell', () => {
    const spy = vi.fn();
    const { container } = render(<Harness initial={[['AA', 1], ['KK', 1], ['QQ', 1]]} spy={spy} />);
    fireEvent.pointerDown(cell(container, 'AA'));
    fireEvent.pointerEnter(cell(container, 'KK'));
    fireEvent.pointerEnter(cell(container, 'JJ'));
    fireEvent.pointerUp(window);
    expect([...spy.mock.lastCall![0].keys()]).toEqual(['QQ']);
  });

  it('shows mixed weights and overlay colours read-only', () => {
    const onCellTap = vi.fn();
    const { container } = render(
      <RangeGrid range={new Map([['AKs', 0.5]])} overlay={{ AKs: 'rgb(1, 2, 3)' }} onCellTap={onCellTap} />,
    );
    const aks = cell(container, 'AKs') as HTMLElement;
    expect(aks.getAttribute('data-state')).toBe('mixed');
    expect(aks.style.background).toBe('rgb(1, 2, 3)');
    fireEvent.pointerDown(aks);
    fireEvent.click(aks);
    expect(onCellTap).toHaveBeenCalledWith('AKs');
    expect(aks.getAttribute('data-state')).toBe('mixed');
  });
});

describe('RangeGrid display options', () => {
  it('outlines the highlighted hand and can hide labels', () => {
    const { container } = render(<RangeGrid range={new Map([['AKo', 1]])} highlight="AKo" showLabels={false} />);
    expect(cell(container, 'AKo').getAttribute('data-highlight')).toBe('true');
    expect(cell(container, 'AKs').hasAttribute('data-highlight')).toBe(false);
    expect(cell(container, 'AKo').textContent).toBe('');
    expect(cell(container, 'AKo').getAttribute('title')).toBe('AKo');
  });

  it('shows labels by default', () => {
    const { container } = render(<RangeGrid range={new Map()} />);
    expect(cell(container, 'T9s').textContent).toBe('T9s');
  });
});
