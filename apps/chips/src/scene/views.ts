import type { ViewName } from '../settings';
import type { Vec3 } from '../tricks/types';

// Camera position relative to the trick's focus point. +Z is the player's side.
export const VIEW_OFFSETS: Record<ViewName, Vec3> = {
  self: [0, 95, 120],
  front: [0, 25, 150],
  diagonal: [100, 75, 95],
  top: [0, 170, 0.01],
  opposite: [0, 70, -130],
};

export const H_FOV = 48;
