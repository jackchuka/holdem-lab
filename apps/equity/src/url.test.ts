import { describe, expect, it } from 'vitest';
import { parseCards } from '@holdem-lab/engine';
import { initialState, type AppState } from './state';
import { UrlStateError, decodeState, encodeState } from './url';

describe('url state', () => {
  it('round-trips hands, ranges, random seats, board and focus', () => {
    const s: AppState = {
      board: parseCards('As7h2d'),
      players: [
        { kind: 'hand', cards: parseCards('KsKh') },
        { kind: 'range', range: new Map([['QQ', 1], ['JJ', 1], ['AKo', 0.5]]) },
        { kind: 'random' },
        { kind: 'hand', cards: [parseCards('Tc')[0], null] },
      ],
      focus: 2,
    };
    const back = decodeState(encodeState(s))!;
    expect(back.board).toEqual(s.board);
    expect(back.focus).toBe(2);
    expect(back.players[0]).toEqual(s.players[0]);
    expect(back.players[1].kind === 'range' && [...back.players[1].range.entries()].sort(([a], [b]) => a.localeCompare(b))).toEqual(
      [['AKo', 0.5], ['JJ', 1], ['QQ', 1]],
    );
    expect(back.players[2]).toEqual({ kind: 'random' });
    expect(back.players[3]).toEqual(s.players[3]);
  });

  it('keeps the initial state short', () => {
    expect(encodeState(initialState())).toBe('?p=&p=');
    expect(decodeState(encodeState(initialState()))).toEqual(initialState());
  });

  it('returns null when there is nothing to restore', () => {
    expect(decodeState('')).toBeNull();
    expect(decodeState('?utm=x')).toBeNull();
  });

  it.each([
    ['one player', '?p=AsKs'],
    ['ten players', `?${'p=x&'.repeat(10)}`],
    ['six board cards', '?b=As2s3s4s5s6s&p=x&p=x'],
    ['bad card', '?p=ZzKs&p=x'],
    ['three hole cards', '?p=AsKsQs&p=x'],
    ['bad range', '?p=r:AK&p=x'],
    ['focus out of range', '?p=x&p=x&f=2'],
  ])('rejects %s', (_, search) => {
    expect(() => decodeState(search)).toThrow(UrlStateError);
  });
});
