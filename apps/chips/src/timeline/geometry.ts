import { CHIP } from '../tricks/types';
import { rotate } from './math';
import type { ChipState } from './timeline';

const EPS = 1e-6;
const axis = (c: ChipState) => rotate(c.quat, [0, 1, 0]);

// Both faces look alike and a spin about the chip's own axis is invisible, so only position and axis line matter.
export function sameLook(a: ChipState, b: ChipState): boolean {
  if (a.pos.some((x, i) => Math.abs(x - b.pos[i]) > EPS)) return false;
  const [ax, ay, az] = axis(a), [bx, by, bz] = axis(b);
  return Math.abs(ax * bx + ay * by + az * bz) > 1 - EPS;
}

export function lowestPoint(c: ChipState): number {
  const ay = axis(c)[1];
  return c.pos[1] - (CHIP.radius * Math.sqrt(Math.max(0, 1 - ay * ay)) + (CHIP.thickness / 2) * Math.abs(ay));
}
