import { RANKS, type HandClass } from '@holdem-lab/engine';

const R = '[2-9TJQKA]';
const idx = (r: string) => RANKS.indexOf(r);
const between = (a: number, b: number) =>
  Array.from({ length: Math.abs(a - b) + 1 }, (_, i) => Math.min(a, b) + i);

export function expandNotation(token: string): HandClass[] {
  const t = token.trim();
  let m: RegExpExecArray | null;

  if ((m = new RegExp(`^(${R})\\1\\+$`).exec(t))) {
    return between(idx(m[1]), 12).map((r) => RANKS[r] + RANKS[r]);
  }
  if ((m = new RegExp(`^(${R})\\1-(${R})\\2$`).exec(t))) {
    return between(idx(m[1]), idx(m[2])).map((r) => RANKS[r] + RANKS[r]);
  }
  if ((m = new RegExp(`^(${R})\\1$`).exec(t))) return [t];

  const nonPair = (hi: string, lo: string) => {
    if (idx(lo) >= idx(hi)) throw new Error(`invalid range token: ${token}`);
  };
  if ((m = new RegExp(`^(${R})(${R})([so])\\+$`).exec(t))) {
    nonPair(m[1], m[2]);
    return between(idx(m[2]), idx(m[1]) - 1).map((r) => m![1] + RANKS[r] + m![3]);
  }
  if ((m = new RegExp(`^(${R})(${R})([so])-\\1(${R})\\3$`).exec(t))) {
    nonPair(m[1], m[2]);
    nonPair(m[1], m[4]);
    return between(idx(m[2]), idx(m[4])).map((r) => m![1] + RANKS[r] + m![3]);
  }
  if ((m = new RegExp(`^(${R})(${R})([so])$`).exec(t))) {
    nonPair(m[1], m[2]);
    return [t];
  }
  throw new Error(`invalid range token: ${token}`);
}
