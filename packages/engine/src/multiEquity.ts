import { HAND_CLASSES, handClassOf, type Card } from './cards';
import { evaluate } from './evaluator';
import { createRng } from './rng';

export type Combo = readonly [Card, Card];
export type WeightedCombo = { combo: Combo; weight: number };
export type PlayerInput = { kind: 'hand'; cards: Combo } | { kind: 'range'; combos: readonly WeightedCombo[] };

type Track = { samples: number[]; share: number[] };
export type EquityStats = {
  samples: number;
  share: number[];
  win: number[];
  tie: number[];
  shareSq: number[];
  nextCard?: Track;
  byClass?: Track;
};

export type SessionOptions = {
  seed?: number;
  mode?: 'auto' | 'exact' | 'mc';
  exactLimit?: number;
  trackNextCard?: boolean;
  trackClassesOf?: number;
  focus?: number;
  partition?: { index: number; count: number };
};

export type EquitySession = {
  mode: 'exact' | 'mc';
  total: number | null;
  step(n: number): EquityStats;
  done(): boolean;
};

export type EquitySummary = { equity: number[]; win: number[]; tie: number[]; halfWidth: number[] };

export class NoValidCombosError extends Error {
  constructor(readonly player: number | null) {
    super(player === null ? 'no valid combo assignment' : `player ${player} has no valid combos`);
    this.name = 'NoValidCombosError';
  }
}

export const DEFAULT_EXACT_LIMIT = 2_000_000;
const MAX_REJECTS = 1000;
const CLASS_INDEX = new Map(HAND_CLASSES.map((hc, i) => [hc, i]));

type Norm = { a: Card[]; b: Card[]; w: number[]; cls: number[]; cum: number[]; total: number };

const zeros = (n: number) => Array.from<number>({ length: n }).fill(0);
const add = (x: number[], y: number[]) => x.map((v, i) => v + y[i]);

export function emptyStats(players: number, track: { nextCard?: boolean; byClass?: boolean } = {}): EquityStats {
  const s: EquityStats = { samples: 0, share: zeros(players), win: zeros(players), tie: zeros(players), shareSq: zeros(players) };
  if (track.nextCard) s.nextCard = { samples: zeros(52), share: zeros(52) };
  if (track.byClass) s.byClass = { samples: zeros(169), share: zeros(169) };
  return s;
}

function mergeTrack(x: Track | undefined, y: Track | undefined): Track | undefined {
  if (!x || !y) return x ?? y;
  return { samples: add(x.samples, y.samples), share: add(x.share, y.share) };
}

export function mergeStats(a: EquityStats, b: EquityStats): EquityStats {
  const out: EquityStats = {
    samples: a.samples + b.samples,
    share: add(a.share, b.share),
    win: add(a.win, b.win),
    tie: add(a.tie, b.tie),
    shareSq: add(a.shareSq, b.shareSq),
  };
  const nextCard = mergeTrack(a.nextCard, b.nextCard);
  const byClass = mergeTrack(a.byClass, b.byClass);
  if (nextCard) out.nextCard = nextCard;
  if (byClass) out.byClass = byClass;
  return out;
}

export function summarize(s: EquityStats): EquitySummary {
  const n = s.samples;
  const per = (xs: number[]) => xs.map((v) => (n ? v / n : 0));
  const equity = per(s.share);
  const halfWidth = s.shareSq.map((sq, i) =>
    n ? 1.96 * Math.sqrt(Math.max(0, sq / n - equity[i] ** 2) / n) : Infinity,
  );
  return { equity, win: per(s.win), tie: per(s.tie), halfWidth };
}

function choose(n: number, k: number): number {
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

function normalize(p: PlayerInput, dead: Set<Card>, index: number): Norm {
  const list =
    p.kind === 'hand'
      ? [{ combo: p.cards, weight: 1 }]
      : p.combos.filter(({ combo: [x, y], weight }) => weight > 0 && !dead.has(x) && !dead.has(y));
  if (list.length === 0) throw new NoValidCombosError(index);
  const norm: Norm = { a: [], b: [], w: [], cls: [], cum: [], total: 0 };
  for (const { combo: [x, y], weight } of list) {
    norm.a.push(x);
    norm.b.push(y);
    norm.w.push(weight);
    norm.cls.push(CLASS_INDEX.get(handClassOf(x, y))!);
    norm.total += weight;
    norm.cum.push(norm.total);
  }
  return norm;
}

function pickWeighted(cum: number[], r: number): number {
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] > r) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function createEquitySession(
  players: readonly PlayerInput[],
  board: readonly Card[],
  opts: SessionOptions = {},
): EquitySession {
  const n = players.length;
  if (n < 2) throw new Error('need at least 2 players');
  if (board.length > 5) throw new Error('board has more than 5 cards');
  const fixed = [...board, ...players.flatMap((p) => (p.kind === 'hand' ? [...p.cards] : []))];
  if (new Set(fixed).size !== fixed.length) throw new Error('duplicate cards');
  const dead = new Set(fixed);
  const norms = players.map((p, i) => normalize(p, dead, i));

  const need = 5 - board.length;
  const estimate = norms.reduce((m, x) => m * x.a.length, 1) * choose(52 - board.length - 2 * n, need);
  const mode =
    opts.mode === 'exact' || opts.mode === 'mc'
      ? opts.mode
      : estimate <= (opts.exactLimit ?? DEFAULT_EXACT_LIMIT)
        ? 'exact'
        : 'mc';
  const part = opts.partition ?? { index: 0, count: 1 };
  const focus = opts.focus ?? 0;
  const classOf =
    opts.trackClassesOf !== undefined && players[opts.trackClassesOf]?.kind === 'range' ? opts.trackClassesOf : -1;
  const track = { nextCard: !!opts.trackNextCard && (board.length === 3 || board.length === 4), byClass: classOf >= 0 };

  const hands = players.map(() => {
    const h = Array.from<Card>({ length: 7 });
    for (let k = 0; k < board.length; k++) h[2 + k] = board[k];
    return h;
  });
  const pick = zeros(n);
  const ranks = zeros(n);
  const runout = Array.from<Card>({ length: need });
  let current = emptyStats(n, track);

  const assign = (i: number, j: number) => {
    pick[i] = j;
    hands[i][0] = norms[i].a[j];
    hands[i][1] = norms[i].b[j];
  };

  // The final board is a set, so equity given "turn = c" equals the mean over runouts containing c.
  const score = (w: number) => {
    let best = -1;
    let ties = 0;
    for (let i = 0; i < n; i++) {
      const h = hands[i];
      for (let k = 0; k < need; k++) h[2 + board.length + k] = runout[k];
      ranks[i] = evaluate(h);
      if (ranks[i] > best) {
        best = ranks[i];
        ties = 1;
      } else if (ranks[i] === best) ties++;
    }
    const s = 1 / ties;
    const st = current;
    st.samples += w;
    for (let i = 0; i < n; i++) {
      if (ranks[i] !== best) continue;
      st.share[i] += w * s;
      st.shareSq[i] += w * s * s;
      if (ties === 1) st.win[i] += w;
      else st.tie[i] += w;
    }
    const fs = ranks[focus] === best ? s : 0;
    if (st.nextCard) {
      for (const c of runout) {
        st.nextCard.samples[c] += w;
        st.nextCard.share[c] += w * fs;
      }
    }
    if (st.byClass) {
      const ci = norms[classOf].cls[pick[classOf]];
      st.byClass.samples[ci] += w;
      st.byClass.share[ci] += w * fs;
    }
  };

  function* exact(): Generator<void> {
    const used = new Uint8Array(52);
    for (const c of board) used[c] = 1;
    let unit = 0;
    function* runouts(deck: Card[], start: number, depth: number, w: number): Generator<void> {
      if (depth === need) {
        if (unit++ % part.count === part.index) {
          score(w);
          yield;
        }
        return;
      }
      for (let j = start; j <= deck.length - (need - depth); j++) {
        runout[depth] = deck[j];
        yield* runouts(deck, j + 1, depth + 1, w);
      }
    }
    function* assignFrom(i: number, w: number): Generator<void> {
      if (i === n) {
        const deck: Card[] = [];
        for (let c = 0; c < 52; c++) if (!used[c]) deck.push(c);
        yield* runouts(deck, 0, 0, w);
        return;
      }
      const x = norms[i];
      for (let j = 0; j < x.a.length; j++) {
        const p = x.a[j];
        const q = x.b[j];
        if (used[p] || used[q]) continue;
        used[p] = used[q] = 1;
        assign(i, j);
        yield* assignFrom(i + 1, w * x.w[j]);
        used[p] = used[q] = 0;
      }
    }
    yield* assignFrom(0, 1);
  }

  const rng = createRng(opts.seed ?? 1);
  const mcUsed = new Uint8Array(52);
  const mcDeck: Card[] = [];
  const sampleOnce = () => {
    for (let tries = 0; ; tries++) {
      if (tries >= MAX_REJECTS) throw new NoValidCombosError(null);
      mcUsed.fill(0);
      for (const c of board) mcUsed[c] = 1;
      let ok = true;
      for (let i = 0; i < n && ok; i++) {
        const x = norms[i];
        const j = x.a.length === 1 ? 0 : pickWeighted(x.cum, rng.next() * x.total);
        const p = x.a[j];
        const q = x.b[j];
        if (mcUsed[p] || mcUsed[q]) ok = false;
        else {
          mcUsed[p] = mcUsed[q] = 1;
          assign(i, j);
        }
      }
      if (ok) break;
    }
    mcDeck.length = 0;
    for (let c = 0; c < 52; c++) if (!mcUsed[c]) mcDeck.push(c);
    for (let k = 0; k < need; k++) {
      const j = k + rng.int(mcDeck.length - k);
      [mcDeck[k], mcDeck[j]] = [mcDeck[j], mcDeck[k]];
      runout[k] = mcDeck[k];
    }
    score(1);
  };

  const gen = mode === 'exact' ? exact() : null;
  let finished = false;
  return {
    mode,
    total: mode === 'exact' ? Math.ceil(estimate / part.count) : null,
    step(k) {
      current = emptyStats(n, track);
      for (let i = 0; i < k && !finished; i++) {
        if (gen) {
          if (gen.next().done) finished = true;
        } else sampleOnce();
      }
      return current;
    },
    done: () => finished,
  };
}

export function multiEquity(
  players: readonly PlayerInput[],
  board: readonly Card[],
  opts: SessionOptions & { iterations?: number } = {},
): EquityStats {
  const session = createEquitySession(players, board, opts);
  const stats = session.step(session.mode === 'mc' ? (opts.iterations ?? 20000) : Number.MAX_SAFE_INTEGER);
  if (stats.samples === 0 && session.mode === 'exact' && (opts.partition?.count ?? 1) === 1) {
    throw new NoValidCombosError(null);
  }
  return stats;
}
