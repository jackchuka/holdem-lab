import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseCard, parseCards } from '@holdem-lab/engine';
import type { WeightedRange } from '@holdem-lab/ranges';
import { PlayerEditor } from './PlayerEditor';
import { RangeEditor } from './RangeEditor';

afterEach(cleanup);

describe('PlayerEditor hand mode', () => {
  it('fills the two slots and closes when both are set', () => {
    const onChange = vi.fn();
    const onDone = vi.fn();
    const { rerender } = render(
      <PlayerEditor player={{ kind: 'hand', cards: [null, null] }} used={new Set([parseCard('Ks')])} presets={null}
        canRemove={false} onChange={onChange} onRemove={() => {}} onDone={onDone} />,
    );
    expect(screen.getByRole('button', { name: 'K♠' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'A♠' }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'hand', cards: [parseCard('As'), null] });
    rerender(
      <PlayerEditor player={{ kind: 'hand', cards: [parseCard('As'), null] }} used={new Set()} presets={null}
        canRemove={false} onChange={onChange} onRemove={() => {}} onDone={onDone} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'A♥' }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'hand', cards: parseCards('AsAh') });
    expect(onDone).toHaveBeenCalled();
  });

  it('switches kind', () => {
    const onChange = vi.fn();
    render(<PlayerEditor player={{ kind: 'hand', cards: [null, null] }} used={new Set()} presets={null}
      canRemove onChange={onChange} onRemove={() => {}} onDone={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'ランダム' }));
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'random' });
    expect(screen.getByRole('button', { name: 'このプレイヤーを削除' })).toBeTruthy();
  });
});

function RangeHarness({ presets }: { presets: Record<'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB', WeightedRange> | null }) {
  const [range, setRange] = useState<WeightedRange>(new Map());
  return <RangeEditor range={range} presets={presets} onChange={setRange} />;
}

describe('RangeEditor', () => {
  const co: WeightedRange = new Map([['AA', 1], ['KK', 1]]);
  const presets = { UTG: new Map(), HJ: new Map(), CO: co, BTN: new Map(), SB: new Map() };

  it('keeps text, grid and preset in sync', () => {
    const { container } = render(<RangeHarness presets={presets} />);
    const input = screen.getByRole('textbox', { name: 'レンジ表記' });
    fireEvent.click(screen.getByRole('button', { name: 'CO' }));
    expect((input as HTMLInputElement).value).toBe('KK+');
    expect(screen.getByRole('button', { name: 'CO' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.pointerDown(container.querySelector('[data-hc="QQ"]')!);
    fireEvent.pointerUp(window);
    expect((input as HTMLInputElement).value).toBe('QQ+');
    expect(screen.getByText('18 combos · 1.4%')).toBeTruthy();
  });

  it('keeps what the user typed and underlines unreadable tokens', () => {
    const { container } = render(<RangeHarness presets={null} />);
    const input = screen.getByRole('textbox', { name: 'レンジ表記' });
    fireEvent.change(input, { target: { value: 'TT+, AK' } });
    expect((input as HTMLInputElement).value).toBe('TT+, AK');
    expect(container.querySelector('u')!.textContent).toBe('AK');
    expect(container.querySelector('[data-hc="TT"]')!.getAttribute('data-state')).toBe('in');
  });
});
