import { describe, expect, it } from 'vitest';
import { loadSettings, saveSettings, type Settings } from './settings';

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

const sample: Settings = { theme: 'dark', locale: 'en', speed: 0.5, view: 'opposite', mirror: true, trick: 'riffle' };

describe('settings', () => {
  it('round-trips through storage', () => {
    const s = memory();
    saveSettings(sample, s);
    expect(loadSettings(s)).toEqual(sample);
  });

  it('uses defaults for each bad or unknown value', () => {
    const s = memory();
    s.setItem('holdem-lab:chips:settings', '{"theme":"neon","speed":2,"view":"side","mirror":"yes","trick":"double-lift","locale":"en"}');
    expect(loadSettings(s)).toMatchObject({ theme: 'felt', speed: 1, view: 'self', mirror: false, trick: 'thumb-flip', locale: 'en' });
  });

  it('survives broken JSON and missing storage', () => {
    const s = memory();
    s.setItem('holdem-lab:chips:settings', '{not json');
    expect(loadSettings(s).trick).toBe('thumb-flip');
    expect(loadSettings(null).speed).toBe(1);
  });
});
