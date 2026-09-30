import { DEV_PORTS } from '@holdem-lab/assets/apps';
import { describe, expect, it } from 'vitest';
import { homeAppUrl } from './links';

describe('homeAppUrl', () => {
  it('links to apps beside the home page in builds, so a sub-path deploy keeps working', () => {
    expect(homeAppUrl('production')('equity')).toBe('equity/');
  });

  it('links to each dev server in development', () => {
    expect(homeAppUrl('development')('equity')).toBe(`http://localhost:${DEV_PORTS.equity}/`);
  });
});
