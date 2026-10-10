import { DEV_PORTS, appLinks } from '@holdem-lab/assets/apps';
import { describe, expect, it } from 'vitest';

describe('appLinks', () => {
  it('points to sibling paths in builds, as on holdem-lab.com', () => {
    expect(appLinks('production')).toEqual({
      flashcards: '../flashcards/',
      glossary: '../glossary/',
      equity: '../equity/',
      fortune: '../fortune/',
      chips: '../chips/',
    });
  });

  it('points to each app’s own dev server in development', () => {
    expect(appLinks('development')).toEqual({
      flashcards: `http://localhost:${DEV_PORTS.flashcards}/`,
      glossary: `http://localhost:${DEV_PORTS.glossary}/`,
      equity: `http://localhost:${DEV_PORTS.equity}/`,
      fortune: `http://localhost:${DEV_PORTS.fortune}/`,
      chips: `http://localhost:${DEV_PORTS.chips}/`,
    });
  });

  it('gives every app its own dev port', () => {
    expect(new Set(Object.values(DEV_PORTS)).size).toBe(Object.keys(DEV_PORTS).length);
  });
});
