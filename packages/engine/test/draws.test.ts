import { describe, expect, it } from 'vitest';
import { parseCards } from '../src/cards';
import { drawFeatures, drawKey } from '../src/draws';

const key = (h: string, b: string) => drawKey(drawFeatures(parseCards(h), parseCards(b)));

describe('draws', () => {
  it('classifies common draws', () => {
    expect(key('7s6s', 'Ks9s2h')).toBe('flush-draw');
    expect(key('8c7c', 'Ks6h5s')).toBe('oesd');
    expect(key('9c8c', 'Jd7h2s')).toBe('gutshot');
    expect(key('AdKc', '9s7h2c')).toBe('overcards');
    expect(key('8s7s', 'Ks6s5h')).toBe('flush-draw+oesd');
    expect(key('AsKs', '9s7s2h')).toBe('flush-draw+overcards');
    expect(key('9s8s', 'Js7s2h')).toBe('flush-draw+gutshot');
  });

  it('returns null without a draw', () => {
    expect(key('2c3d', 'Ks9h7s')).toBeNull();
  });

  it('ignores straight draws that live entirely on the board', () => {
    expect(drawFeatures(parseCards('2c2d'), parseCards('9h8s7d6c')).straightDraw).toBeNull();
  });
});
