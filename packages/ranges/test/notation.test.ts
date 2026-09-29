import { describe, expect, it } from 'vitest';
import { expandNotation } from '../src/notation';

describe('expandNotation', () => {
  it('expands pairs', () => {
    expect(expandNotation('QQ+')).toEqual(['QQ', 'KK', 'AA']);
    expect(expandNotation('44-22')).toEqual(['22', '33', '44']);
    expect(expandNotation('77')).toEqual(['77']);
  });

  it('expands suited and offsuit ranges', () => {
    expect(expandNotation('KTs+')).toEqual(['KTs', 'KJs', 'KQs']);
    expect(expandNotation('A5s-A2s')).toEqual(['A2s', 'A3s', 'A4s', 'A5s']);
    expect(expandNotation('ATo+')).toEqual(['ATo', 'AJo', 'AQo', 'AKo']);
    expect(expandNotation('T9o')).toEqual(['T9o']);
  });

  it('rejects bad tokens', () => {
    for (const t of ['A', 'AKx', 'KAs', 'AAs', 'A2s-K2s', '']) expect(() => expandNotation(t)).toThrow();
  });
});
