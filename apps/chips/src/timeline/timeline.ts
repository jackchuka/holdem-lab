import type { ChipPose, FingerId, FingerPose, Key, Quat, Trick, Vec3 } from '../tricks/types';
import { EASE, eulerToQuat, lerp3 } from './math';

export type ChipState = { pos: Vec3; quat: Quat };
export type Pose = { chips: Record<string, ChipState>; fingers: Partial<Record<FingerId, FingerPose>> };

// Only shift negative remainders: `(t % d + d) % d` rounds times such as 0.9 down to 0.8999…, which lands on the previous step.
export function wrap(t: number, duration: number): number {
  const r = t % duration;
  return r < 0 ? r + duration : r;
}

export function keyWindow<P>(keys: Key<P>[], t: number): { prev: number; next: number; k: number } {
  if (t <= keys[0].t) return { prev: 0, next: 0, k: 0 };
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const raw = (t - keys[i - 1].t) / (keys[i].t - keys[i - 1].t);
      return { prev: i - 1, next: i, k: EASE[keys[i].ease ?? 'inOut'](raw) };
    }
  }
  const last = keys.length - 1;
  return { prev: last, next: last, k: 0 };
}

export const chipState = (key: ChipPose): ChipState => ({ pos: key.pos, quat: eulerToQuat(key.rot) });

function sampleChip(keys: Key<ChipPose>[], t: number): ChipState {
  const { prev, next, k } = keyWindow(keys, t);
  const a = keys[prev], b = keys[next];
  return { pos: lerp3(a.pos, b.pos, k), quat: eulerToQuat(lerp3(a.rot, b.rot, k)) };
}

function sampleFinger(keys: Key<FingerPose>[], t: number): FingerPose {
  const { prev, next, k } = keyWindow(keys, t);
  const a = keys[prev], b = keys[next];
  return { pos: lerp3(a.pos, b.pos, k), press: t >= b.t ? b.press : a.press };
}

export function poseAt(trick: Trick, t: number): Pose {
  const u = wrap(t, trick.duration);
  return {
    chips: Object.fromEntries(Object.entries(trick.tracks.chips).map(([id, keys]) => [id, sampleChip(keys, u)] as const)),
    fingers: Object.fromEntries(
      Object.entries(trick.tracks.fingers).flatMap(([id, keys]) => (keys ? [[id, sampleFinger(keys, u)] as const] : [])),
    ),
  };
}

export function stepAt(trick: Trick, t: number): number {
  const u = wrap(t, trick.duration);
  const i = trick.steps.findIndex((s) => u >= s.from && u < s.to);
  return i === -1 ? trick.steps.length - 1 : i;
}
