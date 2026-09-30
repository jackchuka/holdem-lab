import { stepAt, wrap } from '../timeline/timeline';
import type { Trick } from '../tricks/types';

export const MAX_DT = 0.1;

// The first rAF timestamp can precede the performance.now() taken when playback starts, so dt may be slightly negative.
export const advance = (t: number, dt: number, speed: number, duration: number): number =>
  wrap(t + Math.min(Math.max(dt, 0), MAX_DT) * speed, duration);

export const clampSeek = (x: number, duration: number): number => Math.min(Math.max(x, 0), duration - 0.001);

export function jumpStep(trick: Trick, t: number, dir: 1 | -1): number {
  const n = trick.steps.length;
  return trick.steps[(stepAt(trick, t) + dir + n) % n].from;
}
