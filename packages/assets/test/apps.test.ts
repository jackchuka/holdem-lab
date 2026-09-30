import { describe, expect, it } from 'vitest';
import { APPS, DEV_PORTS, HOME_DEV_PORT, appLinks } from '../src/apps';

describe('APPS', () => {
  it('lists every app with a unique id and dev port', () => {
    expect(new Set(APPS.map((a) => a.id)).size).toBe(APPS.length);
    expect(new Set(APPS.map((a) => a.devPort)).size).toBe(APPS.length);
  });

  it('keeps the home page dev port apart from the apps', () => {
    expect(HOME_DEV_PORT).toBeTypeOf('number');
    expect(Object.values(DEV_PORTS)).not.toContain(HOME_DEV_PORT);
  });

  it('gives every app a screenshot and a longer lead in both languages', () => {
    for (const a of APPS) {
      expect(a.shot).toMatch(/^[a-z0-9-]+\.png$/);
      expect(a.lead.ja.length).toBeGreaterThan(a.ja.length);
      expect(a.lead.en.length).toBeGreaterThan(a.en.length);
    }
  });

  it('derives DEV_PORTS and appLinks from the list', () => {
    expect(DEV_PORTS).toEqual(Object.fromEntries(APPS.map((a) => [a.id, a.devPort])));
    expect(appLinks('production').equity).toBe('../equity/');
    expect(appLinks('development').equity).toBe(`http://localhost:${DEV_PORTS.equity}/`);
  });
});
