import { describe, expect, it } from 'vitest';
import { lowestPoint, sameLook } from '../timeline/geometry';
import { rotate } from '../timeline/math';
import { chipState, poseAt } from '../timeline/timeline';
import { TRICKS } from './index';
import { CHIP, TRICK_IDS } from './types';

describe.each(TRICKS)('$id', (trick) => {
  const tracks = [...Object.values(trick.tracks.chips), ...Object.values(trick.tracks.fingers)].filter((k) => k !== undefined);

  it('runs every track from 0 to duration with increasing key times', () => {
    for (const keys of tracks) {
      expect(keys[0].t).toBe(0);
      expect(keys.at(-1)!.t).toBe(trick.duration);
      for (let i = 1; i < keys.length; i++) expect(keys[i].t).toBeGreaterThan(keys[i - 1].t);
    }
  });

  it('has a track for exactly the chips and fingers it lists', () => {
    expect(Object.keys(trick.tracks.chips).sort()).toEqual(trick.chips.map((c) => c.id).sort());
    expect(Object.keys(trick.tracks.fingers).sort()).toEqual([...trick.fingers].sort());
  });

  it('loops without a visible seam', () => {
    for (const [id, keys] of Object.entries(trick.tracks.chips)) {
      expect(sameLook(chipState(keys[0]), chipState(keys.at(-1)!)), id).toBe(true);
    }
    for (const [id, keys] of Object.entries(trick.tracks.fingers)) {
      expect(keys.at(-1)!.pos, id).toEqual(keys[0].pos);
      expect(keys.at(-1)!.press, id).toBe(keys[0].press);
    }
  });

  it('covers the loop with ordered steps in both languages', () => {
    expect(trick.steps[0].from).toBe(0);
    expect(trick.steps.at(-1)!.to).toBe(trick.duration);
    trick.steps.forEach((s, i) => {
      expect(s.to).toBeGreaterThan(s.from);
      if (i) expect(s.from).toBe(trick.steps[i - 1].to);
      expect(s.text.ja && s.text.en).toBeTruthy();
    });
  });

  it('keeps every chip above the table', () => {
    for (let t = 0; t < trick.duration; t += 0.01) {
      for (const [id, c] of Object.entries(poseAt(trick, t).chips)) {
        expect(lowestPoint(c), `${id} at ${t.toFixed(2)}s`).toBeGreaterThanOrEqual(trick.floor - 1e-6);
      }
    }
  });
});

describe('thumb flip', () => {
  const trick = TRICKS.find((t) => t.id === 'thumb-flip')!;
  const chips = (t: number) => Object.values(poseAt(trick, t).chips);

  it('carries the outermost chip over the others', () => {
    const [moving, ...rest] = chips(0.45);
    expect(moving.pos[1] - CHIP.radius).toBeGreaterThan(Math.max(...rest.map((c) => c.pos[1] + CHIP.radius)));
  });

  it('holds the stack by its edges: fingers on the upper far rim, thumb on the lower near rim', () => {
    const f = poseAt(trick, 0).fingers;
    for (const id of ['index', 'middle', 'ring'] as const) {
      const [, y, z] = f[id]!.pos;
      expect(y, id).toBeGreaterThan(0);
      expect(z, id).toBeLessThan(0);
      expect(Math.hypot(y, z), id).toBeGreaterThan(CHIP.radius);
      expect(Math.hypot(y, z), id).toBeLessThan(CHIP.radius + 6);
    }
    const [, ty, tz] = f.thumb!.pos;
    expect(ty).toBeLessThan(0);
    expect(tz).toBeGreaterThan(0);
  });

  it('pushes the chip by its rim, not its face', () => {
    const p = poseAt(trick, 0);
    const c = p.chips.c0.pos;
    const th = p.fingers.thumb!.pos;
    expect(Math.abs(th[0] - c[0])).toBeLessThan(CHIP.thickness);
    const radial = Math.hypot(th[1] - c[1], th[2] - c[2]);
    expect(radial).toBeGreaterThan(CHIP.radius);
    expect(radial).toBeLessThan(CHIP.radius + 6);
  });

  it('keeps the thumb on the chip while pushing it up and over', () => {
    for (let t = 0; t <= 0.6; t += 0.05) {
      const pose = poseAt(trick, t);
      const [cx, cy, cz] = pose.chips.c0.pos;
      const [tx, ty, tz] = pose.fingers.thumb!.pos;
      expect(Math.hypot(tx - cx, ty - cy, tz - cz), `${t.toFixed(2)}s`).toBeLessThan(CHIP.radius + 6);
    }
  });

  it('drops it in behind the far chip', () => {
    const [moved, ...rest] = chips(1.2);
    expect(moved.pos[0]).toBeGreaterThan(Math.max(...rest.map((c) => c.pos[0])));
  });
});

describe('chip twist', () => {
  const trick = TRICKS.find((t) => t.id === 'chip-twist')!;
  const pose = (t: number) => poseAt(trick, t);
  const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));
  // The chips stand facing the thumb like in the other tricks. In the chip's own frame, +X is the rim point
  // that starts at the top and +Z the one that starts nearest the player.
  const TOP: [number, number, number] = [1, 0, 0];
  const NEAR: [number, number, number] = [0, 0, 1];
  const SPINNING = [1.1, 1.4, 1.7];

  it('pinches the stack by its edges: thumb on the near rim, index finger on the far rim', () => {
    const { thumb, index } = pose(0).fingers;
    expect(thumb!.pos[2]).toBeGreaterThan(CHIP.radius);
    expect(index!.pos[2]).toBeLessThan(-CHIP.radius);
    for (const f of [thumb!, index!]) expect(Math.abs(f.pos[0])).toBeLessThan(CHIP.thickness * 1.5);
  });

  it('sweeps the ring finger with the far edge from back to front as it spins the chip', () => {
    for (let t = 1; t <= 1.8; t += 0.05) {
      const p = pose(t);
      const c = p.chips.center;
      const edge = rotate(c.quat, [0, 0, -CHIP.radius]).map((v, i) => v + c.pos[i]);
      const r = p.fingers.ring!.pos;
      expect(Math.hypot(r[0] - edge[0], r[1] - edge[1], r[2] - edge[2]), `${t.toFixed(2)}s`).toBeLessThan(6);
    }
    expect(pose(1).fingers.ring!.pos[2]).toBeLessThan(0);
    expect(pose(1.8).fingers.ring!.pos[2]).toBeGreaterThan(0);
  });

  it('starts facing the thumb, like the other tricks', () => {
    close(rotate(pose(0).chips.center.quat, [0, 1, 0]).map(Math.abs), [1, 0, 0]);
  });

  it('raises the outer two with the thumb, pivoting on the index finger, and drops the middle one', () => {
    const start = pose(0);
    for (const t of SPINNING) {
      const p = pose(t);
      close(p.fingers.index!.pos, start.fingers.index!.pos);
      expect(p.fingers.thumb!.pos[1], `${t}s`).toBeGreaterThan(start.fingers.thumb!.pos[1] + CHIP.radius);
      expect(p.chips.left.pos[1], `${t}s`).toBeGreaterThan(start.chips.left.pos[1]);
      expect(p.chips.center.pos[1], `${t}s`).toBeLessThan(start.chips.center.pos[1]);
    }
  });

  it('spins the middle chip on a vertical axis', () => {
    for (const t of SPINNING) close(rotate(pose(t).chips.center.quat, TOP), [0, 1, 0]);
  });

  it('rests the middle chip on the middle finger, the vertical axis, and turns its near edge toward the thumb', () => {
    const p = pose(1.4);
    expect(p.fingers.middle!.pos[1]).toBeLessThan(p.chips.center.pos[1] - CHIP.radius);
    expect(p.fingers.middle!.press).toBe(true);
    expect(rotate(p.chips.center.quat, NEAR)[0]).toBeLessThan(0);
  });
});

describe('riffle', () => {
  const trick = TRICKS.find((t) => t.id === 'riffle')!;
  const x = (f: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky') => poseAt(trick, 0).fingers[f]!.pos[0];

  it('holds the left stack with thumb and index, the right with ring and pinky, and puts the middle finger between', () => {
    expect(x('thumb')).toBeLessThan(0);
    expect(x('index')).toBeLessThan(0);
    expect(Math.abs(x('middle'))).toBeLessThan(CHIP.radius / 2);
    expect(x('ring')).toBeGreaterThan(0);
    expect(x('pinky')).toBeGreaterThan(0);
  });
});

it('lists every trick once, in tab order', () => {
  expect(TRICKS.map((t) => t.id)).toEqual([...TRICK_IDS]);
});
