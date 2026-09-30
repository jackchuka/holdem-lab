import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../tricks/types';
import { EASE, eulerToQuat, lerp3, rotate } from './math';

const close = (a: Vec3, b: Vec3) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i], 9));

describe('EASE', () => {
  it('starts at 0 and ends at 1', () => {
    for (const f of Object.values(EASE)) {
      expect(f(0)).toBe(0);
      expect(f(1)).toBe(1);
    }
  });

  it('shapes the middle', () => {
    expect(EASE.linear(0.3)).toBeCloseTo(0.3);
    expect(EASE.in(0.5)).toBeCloseTo(0.25);
    expect(EASE.out(0.5)).toBeCloseTo(0.75);
    expect(EASE.inOut(0.25)).toBeCloseTo(0.125);
    expect(EASE.inOut(0.75)).toBeCloseTo(0.875);
  });
});

describe('lerp3', () => {
  it('interpolates each axis', () => close(lerp3([0, 10, -4], [10, 20, 4], 0.25), [2.5, 12.5, -2]));
});

describe('eulerToQuat', () => {
  it('turns +90° about X so that up points toward the viewer', () => close(rotate(eulerToQuat([90, 0, 0]), [0, 1, 0]), [0, 0, 1]));
  it('turns +90° about Z so that up points left', () => close(rotate(eulerToQuat([0, 0, 90]), [0, 1, 0]), [-1, 0, 0]));
  it('applies the three.js XYZ order: the Z turn acts on the vector first', () => close(rotate(eulerToQuat([90, 0, 90]), [0, 1, 0]), [-1, 0, 0]));
  it('is the identity at zero', () => close(rotate(eulerToQuat([0, 0, 0]), [1, 2, 3]), [1, 2, 3]));
});
