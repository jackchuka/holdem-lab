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

  it('derives DEV_PORTS and appLinks from the list', () => {
    expect(DEV_PORTS).toEqual(Object.fromEntries(APPS.map((a) => [a.id, a.devPort])));
    expect(appLinks('production').equity).toBe('../equity/');
    expect(appLinks('development').equity).toBe(`http://localhost:${DEV_PORTS.equity}/`);
  });
});
