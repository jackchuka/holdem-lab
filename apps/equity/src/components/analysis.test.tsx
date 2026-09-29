import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HAND_CLASSES, emptyStats, multiEquity, parseCard, parseCards, type PlayerInput } from '@holdem-lab/engine';
import type { EquityView } from '../compute/useEquity';
import type { AppState } from '../state';
import { toInputs } from '../state';
import { AnalysisTabs } from './AnalysisTabs';

const hand = (s: string): PlayerInput => {
  const [a, b] = parseCards(s);
  return { kind: 'hand', cards: [a, b] };
};
const state: AppState = {
  board: parseCards('2c7d9h'),
  players: [{ kind: 'hand', cards: parseCards('AsAh') }, { kind: 'hand', cards: parseCards('KsKh') }],
  focus: 0,
};
const view: EquityView = {
  status: 'done',
  mode: 'exact',
  error: null,
  stats: multiEquity([hand('AsAh'), hand('KsKh')], state.board, { mode: 'exact', trackNextCard: true }),
  streets: [
    { street: 'pre', equity: [0.82, 0.18] },
    { street: 'flop', equity: [0.91, 0.09] },
  ],
};

afterEach(cleanup);

describe('AnalysisTabs', () => {
  it('places a tapped next card on the board', () => {
    const onPlace = vi.fn();
    render(<AnalysisTabs view={view} state={state} opponent={null} onFocus={() => {}} onOpponent={() => {}} onPlace={onPlace} />);
    fireEvent.click(screen.getByRole('button', { name: /^K♣/ }));
    expect(onPlace).toHaveBeenCalledWith(parseCard('Kc'));
    expect(screen.queryByText('下がるカード 2/45')).not.toBeNull();
  });

  it('switches the focus player', () => {
    const onFocus = vi.fn();
    render(<AnalysisTabs view={view} state={state} opponent={null} onFocus={onFocus} onOpponent={() => {}} onPlace={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'P2' }));
    expect(onFocus).toHaveBeenCalledWith(1);
  });

  it('asks for a range opponent and draws street lines', () => {
    render(<AnalysisTabs view={view} state={state} opponent={null} onFocus={() => {}} onOpponent={() => {}} onPlace={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'レンジ内' }));
    expect(screen.queryByText('レンジかランダムの相手を追加すると表示')).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '推移' }));
    expect(document.querySelectorAll('polyline')).toHaveLength(2);
  });

  it('resets the selected range cell when the opponent changes', () => {
    const rangeState: AppState = {
      board: parseCards('Kd7c2h3s9d'),
      players: [
        { kind: 'hand', cards: parseCards('AsAh') },
        { kind: 'range', range: new Map([['KK', 1], ['QQ', 1]]) },
        { kind: 'random' },
      ],
      focus: 0,
    };
    const rangeView: EquityView = {
      status: 'done',
      mode: 'exact',
      error: null,
      stats: multiEquity(toInputs(rangeState), rangeState.board, { mode: 'exact', trackClassesOf: 1 }),
      streets: [],
    };
    const props = { view: rangeView, state: rangeState, onFocus: () => {}, onOpponent: () => {}, onPlace: () => {} };
    const { rerender } = render(<AnalysisTabs {...props} opponent={1} />);
    fireEvent.click(screen.getByRole('tab', { name: 'レンジ内' }));
    fireEvent.click(screen.getByText('KK'));
    expect(screen.queryByText(/^KK · /)).not.toBeNull();
    rerender(<AnalysisTabs {...props} opponent={2} />);
    expect(screen.queryByText(/^KK · /)).toBeNull();
  });

  it('draws thin-sample range cells with a lighter overlay', () => {
    const rangeState: AppState = {
      board: parseCards('Kd7c2h3s9d'),
      players: [
        { kind: 'hand', cards: parseCards('AsAh') },
        { kind: 'range', range: new Map([['QQ', 1], ['JJ', 1]]) },
      ],
      focus: 0,
    };
    const stats = { ...emptyStats(2, { byClass: true }), samples: 10_000 };
    const set = (hc: string, n: number) => {
      const i = HAND_CLASSES.indexOf(hc);
      stats.byClass!.samples[i] = n;
      stats.byClass!.share[i] = n * 0.9;
    };
    set('QQ', 9000);
    set('JJ', 10);
    const rangeView: EquityView = { status: 'done', mode: 'mc', error: null, stats, streets: [] };
    render(<AnalysisTabs view={rangeView} state={rangeState} opponent={1} onFocus={() => {}} onOpponent={() => {}} onPlace={() => {}} />);
    fireEvent.click(screen.getByRole('tab', { name: 'レンジ内' }));
    const background = (hc: string) => document.querySelector(`[data-hc="${hc}"]`)!.getAttribute('style');
    expect(background('QQ')).toContain('var(--heat-pos) 80%');
    expect(background('JJ')).toContain('var(--heat-pos) 36%');
  });
});
