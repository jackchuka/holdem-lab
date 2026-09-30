import { describe, expect, it } from 'vitest';
import { loadSettings, saveSettings } from './settings';

function memory() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

describe('settings', () => {
  it('round-trips and ignores invalid values', () => {
    const kv = memory();
    saveSettings({ theme: 'dark', locale: 'en', fourColor: true }, kv);
    expect(loadSettings(kv)).toEqual({ theme: 'dark', locale: 'en', fourColor: true });
    kv.setItem('holdem-lab:fortune:settings', JSON.stringify({ theme: 'neon', locale: 'fr', fourColor: 'yes' }));
    expect(loadSettings(kv).theme).toBe('felt');
  });
});
