import { describe, expect, it } from 'vitest';
import { lowestPoint, sameLook } from './geometry';
import { chipState } from './timeline';

describe('sameLook', () => {
  const flat = chipState({ pos: [0, 0, 0], rot: [0, 0, 0] });
  it('treats a flipped or spun chip as the same', () => {
    expect(sameLook(flat, chipState({ pos: [0, 0, 0], rot: [180, 0, 0] }))).toBe(true);
    expect(sameLook(flat, chipState({ pos: [0, 0, 0], rot: [0, 90, 0] }))).toBe(true);
  });
  it('tells a standing chip or a moved chip apart', () => {
    expect(sameLook(flat, chipState({ pos: [0, 0, 0], rot: [90, 0, 0] }))).toBe(false);
    expect(sameLook(flat, chipState({ pos: [0, 0.1, 0], rot: [0, 0, 0] }))).toBe(false);
  });
});

describe('lowestPoint', () => {
  it('is half the thickness below a flat chip', () => expect(lowestPoint(chipState({ pos: [0, 10, 0], rot: [0, 0, 0] }))).toBeCloseTo(8.35));
  it('is the radius below a standing chip', () => expect(lowestPoint(chipState({ pos: [0, 30, 0], rot: [90, 0, 0] }))).toBeCloseTo(10.5));
});
