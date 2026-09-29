import type { Card, PlayerInput, WeightedCombo } from '@holdem-lab/engine';
import { fullRange, rangeToCombos, type WeightedRange } from '@holdem-lab/ranges';

export type PlayerState =
  | { kind: 'hand'; cards: (Card | null)[] }
  | { kind: 'range'; range: WeightedRange }
  | { kind: 'random' };
export type AppState = { board: Card[]; players: PlayerState[]; focus: number };
export type Readiness =
  | { ok: true }
  | { ok: false; reason: 'incomplete' | 'board' }
  | { ok: false; reason: 'duplicate'; players: number[] };

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 9;

export const emptyHand = (): PlayerState => ({ kind: 'hand', cards: [null, null] });
export const initialState = (): AppState => ({ board: [], players: [emptyHand(), emptyHand()], focus: 0 });

export function handCards(p: PlayerState): Card[] {
  return p.kind === 'hand' ? p.cards.filter((c): c is Card => c !== null) : [];
}

export function usedCards(s: AppState, skip: { player?: number; board?: boolean } = {}): Set<Card> {
  const out = new Set<Card>(skip.board ? [] : s.board);
  s.players.forEach((p, i) => {
    if (i !== skip.player) for (const c of handCards(p)) out.add(c);
  });
  return out;
}

export function checkState(s: AppState): Readiness {
  const count = new Map<Card, number>();
  for (const c of [...s.board, ...s.players.flatMap(handCards)]) count.set(c, (count.get(c) ?? 0) + 1);
  const dup = (c: Card) => (count.get(c) ?? 0) > 1;
  if ([...count.keys()].some(dup)) {
    return { ok: false, reason: 'duplicate', players: s.players.flatMap((p, i) => (handCards(p).some(dup) ? [i] : [])) };
  }
  if (s.players.some((p) => p.kind === 'hand' && p.cards.includes(null))) return { ok: false, reason: 'incomplete' };
  if (![0, 3, 4, 5].includes(s.board.length)) return { ok: false, reason: 'board' };
  return { ok: true };
}

let fullCombos: WeightedCombo[] | null = null;

export function toInputs(s: AppState): PlayerInput[] {
  return s.players.map((p): PlayerInput => {
    if (p.kind === 'hand') return { kind: 'hand', cards: [p.cards[0]!, p.cards[1]!] };
    if (p.kind === 'range') return { kind: 'range', combos: rangeToCombos(p.range) };
    fullCombos ??= rangeToCombos(fullRange());
    return { kind: 'range', combos: fullCombos };
  });
}

export function setPlayer(s: AppState, i: number, p: PlayerState): AppState {
  return { ...s, players: s.players.map((q, j) => (j === i ? p : q)) };
}

export function addPlayer(s: AppState): AppState {
  return s.players.length >= MAX_PLAYERS ? s : { ...s, players: [...s.players, emptyHand()] };
}

export function removePlayer(s: AppState, i: number): AppState {
  if (s.players.length <= MIN_PLAYERS) return s;
  const focus = s.focus === i ? 0 : s.focus > i ? s.focus - 1 : s.focus;
  return { ...s, players: s.players.filter((_, j) => j !== i), focus };
}

export function pickOpponent(s: AppState, preferred: number | null): number | null {
  const candidates = s.players.flatMap((p, i) => (i !== s.focus && p.kind !== 'hand' ? [i] : []));
  if (preferred !== null && candidates.includes(preferred)) return preferred;
  return candidates[0] ?? null;
}
