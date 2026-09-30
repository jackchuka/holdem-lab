import { describe, expect, it } from 'vitest';
import { createStore, localDate, myKey, newDeviceId, type KeyValue } from './store';

function memory(): KeyValue & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const broken: KeyValue = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('denied');
  },
};

describe('createStore', () => {
  it('creates the device id once and keeps it', () => {
    const kv = memory();
    let calls = 0;
    const store = createStore(kv, () => `id${++calls}`.padEnd(16, '0'));
    expect(store.deviceId()).toBe('id10000000000000');
    expect(store.deviceId()).toBe('id10000000000000');
    expect(createStore(kv, () => 'other').deviceId()).toBe('id10000000000000');
    expect(kv.data.get('holdem-lab:fortune:device')).toBe('id10000000000000');
  });

  it('ignores a stored device id that is not 16 lowercase alphanumerics', () => {
    const kv = memory();
    kv.setItem('holdem-lab:fortune:device', 'BAD');
    expect(createStore(kv, () => 'abcdefghijklmnop').deviceId()).toBe('abcdefghijklmnop');
  });

  it('saves, normalizes, rejects over-long names and clears the name', () => {
    const store = createStore(memory());
    expect(store.savedName()).toBeNull();
    store.setSavedName(' Taro ');
    expect(store.savedName()).toBe('taro');
    store.setSavedName('a'.repeat(30));
    expect(store.savedName()).toBe('taro');
    store.setSavedName('㍿'.repeat(7));
    expect(store.savedName()).toBe('taro');
    store.setSavedName('   ');
    expect(store.savedName()).toBeNull();
    store.setSavedName('taro');
    store.setSavedName(null);
    expect(store.savedName()).toBeNull();
  });

  it('remembers only the latest seen date', () => {
    const store = createStore(memory());
    expect(store.seenToday('2026-09-30')).toBe(false);
    store.markSeen('2026-09-30');
    expect(store.seenToday('2026-09-30')).toBe(true);
    expect(store.seenToday('2026-10-01')).toBe(false);
  });

  it('keeps working in memory when storage throws or is missing', () => {
    for (const kv of [broken, null]) {
      const store = createStore(kv, () => 'abcdefghijklmnop');
      expect(store.deviceId()).toBe('abcdefghijklmnop');
      expect(store.deviceId()).toBe('abcdefghijklmnop');
      store.setSavedName('taro');
      expect(store.savedName()).toBe('taro');
      store.markSeen('2026-09-30');
      expect(store.seenToday('2026-09-30')).toBe(true);
    }
  });
});

describe('myKey', () => {
  it('prefers the saved name over the device id', () => {
    const store = createStore(memory(), () => 'abcdefghijklmnop');
    expect(myKey(store)).toEqual({ kind: 'device', id: 'abcdefghijklmnop' });
    store.setSavedName('Taro');
    expect(myKey(store)).toEqual({ kind: 'name', name: 'taro' });
  });
});

describe('localDate / newDeviceId', () => {
  it('formats the local date', () => {
    expect(localDate(new Date(2026, 8, 5, 23, 59))).toBe('2026-09-05');
  });

  it('makes 16 lowercase alphanumerics', () => {
    expect(newDeviceId()).toMatch(/^[0-9a-z]{16}$/);
  });
});
