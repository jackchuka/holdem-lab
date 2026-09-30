import type { Ease, Euler, Quat, Vec3 } from '../tricks/types';

export const EASE: Record<Ease, (x: number) => number> = {
  linear: (x) => x,
  in: (x) => x * x,
  out: (x) => 1 - (1 - x) ** 2,
  inOut: (x) => (x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) ** 2),
};

export const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// Degrees in, quaternion [x, y, z, w] out, matching three.js Euler order 'XYZ'.
export function eulerToQuat([x, y, z]: Euler): Quat {
  const h = Math.PI / 360;
  const c1 = Math.cos(x * h), c2 = Math.cos(y * h), c3 = Math.cos(z * h);
  const s1 = Math.sin(x * h), s2 = Math.sin(y * h), s3 = Math.sin(z * h);
  return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3];
}

export function rotate([qx, qy, qz, qw]: Quat, [x, y, z]: Vec3): Vec3 {
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  return [ix * qw - iw * qx - iy * qz + iz * qy, iy * qw - iw * qy - iz * qx + ix * qz, iz * qw - iw * qz - ix * qy + iy * qx];
}
