import { NAME_MAX, normalizeName, type FortuneKey } from './fortune';

export type KeyValue = { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void };
export type FortuneStore = {
  deviceId(): string;
  savedName(): string | null;
  setSavedName(name: string | null): void;
  seenToday(date: string): boolean;
  markSeen(date: string): void;
};

const PREFIX = 'holdem-lab:fortune:';
const DEVICE_ID = /^[0-9a-z]{16}$/;
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function browserStorage(): KeyValue | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function newDeviceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function createStore(storage: KeyValue | null = browserStorage(), random: () => string = newDeviceId): FortuneStore {
  const memory = new Map<string, string | null>();
  const get = (k: string): string | null => {
    if (memory.has(k)) return memory.get(k) ?? null;
    try {
      return storage?.getItem(PREFIX + k) ?? null;
    } catch {
      return null;
    }
  };
  const set = (k: string, v: string | null) => {
    memory.set(k, v);
    try {
      if (v === null) storage?.removeItem(PREFIX + k);
      else storage?.setItem(PREFIX + k, v);
    } catch {
      return;
    }
  };
  return {
    deviceId() {
      const stored = get('device');
      if (stored && DEVICE_ID.test(stored)) return stored;
      const id = random();
      set('device', id);
      return id;
    },
    savedName() {
      const name = normalizeName(get('name') ?? '');
      return name && name.length <= NAME_MAX ? name : null;
    },
    setSavedName(name) {
      const n = name === null ? '' : normalizeName(name);
      if (n.length > NAME_MAX) return;
      set('name', n || null);
    },
    seenToday: (date) => get('seen') === date,
    markSeen: (date) => set('seen', date),
  };
}

export function myKey(store: FortuneStore): FortuneKey {
  const name = store.savedName();
  return name ? { kind: 'name', name } : { kind: 'device', id: store.deviceId() };
}

export function localDate(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
