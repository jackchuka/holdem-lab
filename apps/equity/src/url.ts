import { cardsToString, parseCards, type Card } from '@holdem-lab/engine';
import { formatRange, parseRange } from '@holdem-lab/ranges';
import { MAX_PLAYERS, MIN_PLAYERS, type AppState, type PlayerState } from './state';

export class UrlStateError extends Error {}

function encodePlayer(p: PlayerState): string {
  if (p.kind === 'random') return 'x';
  if (p.kind === 'range') return `r:${formatRange(p.range)}`;
  return cardsToString(p.cards.filter((c): c is Card => c !== null));
}

function decodePlayer(v: string): PlayerState {
  if (v === 'x') return { kind: 'random' };
  if (v.startsWith('r:')) {
    const { range, errors } = parseRange(v.slice(2));
    if (errors.length) throw new UrlStateError(`bad range: ${v}`);
    return { kind: 'range', range };
  }
  const cards = parseCards(v);
  if (cards.length > 2) throw new UrlStateError(`bad hand: ${v}`);
  return { kind: 'hand', cards: [cards[0] ?? null, cards[1] ?? null] };
}

export function encodeState(s: AppState): string {
  const q = new URLSearchParams();
  if (s.board.length) q.set('b', cardsToString(s.board));
  for (const p of s.players) q.append('p', encodePlayer(p));
  if (s.focus) q.set('f', String(s.focus));
  return `?${q}`;
}

export function decodeState(search: string): AppState | null {
  const q = new URLSearchParams(search);
  const raw = q.getAll('p');
  if (!raw.length && !q.has('b')) return null;
  try {
    if (raw.length < MIN_PLAYERS || raw.length > MAX_PLAYERS) throw new UrlStateError('player count');
    const board = parseCards(q.get('b') ?? '');
    if (board.length > 5) throw new UrlStateError('board');
    const players = raw.map(decodePlayer);
    const focus = Number(q.get('f') ?? 0);
    if (!Number.isInteger(focus) || focus < 0 || focus >= players.length) throw new UrlStateError('focus');
    return { board, players, focus };
  } catch (e) {
    throw e instanceof UrlStateError ? e : new UrlStateError((e as Error).message);
  }
}
