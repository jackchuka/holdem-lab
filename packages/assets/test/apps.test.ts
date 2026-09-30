import { describe, expect, it } from 'vitest';
import { APPS, DEV_PORTS, appLinks } from '../src/apps';

describe('APPS', () => {
  it('lists every app with a unique id and dev port', () => {
    expect(new Set(APPS.map((a) => a.id)).size).toBe(APPS.length);
    expect(new Set(APPS.map((a) => a.devPort)).size).toBe(APPS.length);
  });

  it('derives DEV_PORTS and appLinks from the list', () => {
    expect(DEV_PORTS).toEqual(Object.fromEntries(APPS.map((a) => [a.id, a.devPort])));
    expect(appLinks('production').equity).toBe('../equity/');
    expect(appLinks('development').equity).toBe(`http://localhost:${DEV_PORTS.equity}/`);
  });
});
