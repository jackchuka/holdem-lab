import { describe, expect, it } from 'vitest';
import { parseCard, parseCards } from '@holdem-lab/engine';
import {
  addPlayer,
  checkState,
  initialState,
  pickOpponent,
  removePlayer,
  toInputs,
  usedCards,
  type AppState,
} from './state';

const hand = (s: string) => ({ kind: 'hand' as const, cards: parseCards(s) });
const base = (): AppState => ({ board: parseCards('9s8s2d'), players: [hand('AsKs'), hand('QhQd')], focus: 0 });

describe('checkState', () => {
  it('is ready with full hands and a 0/3/4/5-card board', () => {
    expect(checkState(base())).toEqual({ ok: true });
    expect(checkState({ ...base(), board: [] })).toEqual({ ok: true });
  });

  it('waits for incomplete hands and partial boards', () => {
    expect(checkState(initialState())).toEqual({ ok: false, reason: 'incomplete' });
    expect(checkState({ ...base(), board: parseCards('9s8s') })).toEqual({ ok: false, reason: 'board' });
  });

  it('names players holding duplicate cards', () => {
    const s = { ...base(), players: [hand('AsKs'), hand('QhQd'), hand('Ks2c')] };
    expect(checkState(s)).toEqual({ ok: false, reason: 'duplicate', players: [0, 2] });
    expect(checkState({ ...base(), board: parseCards('As8s2d') })).toEqual({ ok: false, reason: 'duplicate', players: [0] });
  });
});

describe('player list', () => {
  it('adds up to nine and removes down to two, keeping focus on the same seat', () => {
    let s = initialState();
    for (let i = 0; i < 10; i++) s = addPlayer(s);
    expect(s.players).toHaveLength(9);
    s = { ...s, focus: 4 };
    s = removePlayer(s, 1);
    expect(s.focus).toBe(3);
    s = removePlayer(s, 3);
    expect(s.focus).toBe(0);
    const two = initialState();
    expect(removePlayer(two, 0)).toBe(two);
  });
});

describe('usedCards and inputs', () => {
  it('collects cards except the one being edited', () => {
    const s = base();
    expect(usedCards(s, { player: 0 }).has(parseCard('As'))).toBe(false);
    expect(usedCards(s, { player: 0 }).has(parseCard('Qh'))).toBe(true);
    expect(usedCards(s, { board: true }).has(parseCard('9s'))).toBe(false);
  });

  it('turns ranges and random seats into weighted combos', () => {
    const s: AppState = { ...base(), players: [hand('AsKs'), { kind: 'range', range: new Map([['QQ', 0.5]]) }, { kind: 'random' }] };
    const [h, r, x] = toInputs(s);
    expect(h).toEqual({ kind: 'hand', cards: parseCards('AsKs') });
    expect(r.kind === 'range' && r.combos.length).toBe(6);
    expect(x.kind === 'range' && x.combos.length).toBe(1326);
  });

  it('picks a range opponent other than the focus player', () => {
    const s: AppState = { ...base(), players: [hand('AsKs'), { kind: 'random' }, { kind: 'range', range: new Map() }] };
    expect(pickOpponent(s, null)).toBe(1);
    expect(pickOpponent(s, 2)).toBe(2);
    expect(pickOpponent({ ...s, focus: 1 }, 1)).toBe(2);
    expect(pickOpponent(base(), null)).toBeNull();
  });
});
