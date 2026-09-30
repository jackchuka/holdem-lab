import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPS } from '@holdem-lab/assets/apps';
import { describe, expect, it } from 'vitest';

const SHOTS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../docs/assets');

describe('APPS on the home page', () => {
  it('has a screenshot in docs/assets for every app', () => {
    for (const a of APPS) expect(existsSync(resolve(SHOTS, a.shot)), a.shot).toBe(true);
  });
});
