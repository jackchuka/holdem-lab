import { DEV_PORTS, appLinks } from '@holdem-lab/assets/apps';
import { describe, expect, it } from 'vitest';

describe('appLinks', () => {
  it('points to sibling paths in builds, as on holdem-lab.com', () => {
    expect(appLinks('production')).toEqual({ flashcards: '../flashcards/', equity: '../equity/', fortune: '../fortune/' });
  });

  it('points to each app’s own dev server in development', () => {
    expect(appLinks('development')).toEqual({
      flashcards: `http://localhost:${DEV_PORTS.flashcards}/`,
      equity: `http://localhost:${DEV_PORTS.equity}/`,
      fortune: `http://localhost:${DEV_PORTS.fortune}/`,
    });
  });

  it('gives every app its own dev port', () => {
    expect(new Set(Object.values(DEV_PORTS)).size).toBe(Object.keys(DEV_PORTS).length);
  });
});
