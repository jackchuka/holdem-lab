import { describe, expect, it } from 'vitest';
import { loadSettings, saveSettings, type Settings } from './settings';

const KEY = 'holdem-lab:glossary:settings';
const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe('settings', () => {
  it('round-trips through storage', () => {
    const s = memory();
    const sample: Settings = { theme: 'dark', locale: 'en', direction: 'random' };
    saveSettings(sample, s);
    expect(loadSettings(s)).toEqual(sample);
  });

  it('uses the default for each bad or unknown value and keeps the good ones', () => {
    const s = memory();
    s.setItem(KEY, '{"theme":"neon","direction":"up","locale":"en"}');
    expect(loadSettings(s)).toEqual({ theme: 'felt', direction: 'en-ja', locale: 'en' });
  });

  it('survives broken JSON, missing storage and storage that throws', () => {
    const s = memory();
    s.setItem(KEY, '{not json');
    expect(loadSettings(s).direction).toBe('en-ja');
    expect(loadSettings(null).theme).toBe('felt');
    const throwing = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(loadSettings(throwing).theme).toBe('felt');
    expect(() => saveSettings({ theme: 'dark', locale: 'ja', direction: 'ja-en' }, throwing)).not.toThrow();
  });
});
