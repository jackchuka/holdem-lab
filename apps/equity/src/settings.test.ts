import { describe, expect, it } from 'vitest';
import { loadSettings, saveSettings } from './settings';

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe('settings', () => {
  it('round-trips through storage', () => {
    const s = memory();
    saveSettings({ theme: 'dark', locale: 'en', fourColor: true }, s);
    expect(loadSettings(s)).toEqual({ theme: 'dark', locale: 'en', fourColor: true });
  });

  it('falls back to defaults on bad data or missing storage', () => {
    const s = memory();
    s.setItem('holdem-lab:equity:settings', '{"theme":"neon","fourColor":"yes"}');
    expect(loadSettings(s).theme).toBe('felt');
    expect(loadSettings(s).fourColor).toBe(false);
    expect(loadSettings(null).theme).toBe('felt');
  });
});
