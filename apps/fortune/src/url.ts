import { NAME_MAX, keyString, normalizeName, type FortuneKey } from './fortune';

export class ShareUrlError extends Error {}

export function isValidDate(date: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === date;
}

function nextDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function shareUrl(base: string, key: FortuneKey, date: string): string {
  return `${base}?k=${encodeURIComponent(keyString(key))}&d=${date}`;
}

function decodeKey(k: string): FortuneKey {
  if (/^u[0-9a-z]{16}$/.test(k)) return { kind: 'device', id: k.slice(1) };
  if (k.startsWith('n')) {
    const name = normalizeName(k.slice(1));
    if (name && name.length <= NAME_MAX) return { kind: 'name', name };
  }
  throw new ShareUrlError(`bad key: ${k}`);
}

export function decodeShare(search: string, today: string): { key: FortuneKey; date: string } | null {
  const q = new URLSearchParams(search);
  const k = q.get('k');
  const d = q.get('d');
  if (k === null && d === null) return null;
  if (k === null || d === null) throw new ShareUrlError('missing parameter');
  if (!isValidDate(d) || d > nextDay(today)) throw new ShareUrlError(`bad date: ${d}`);
  return { key: decodeKey(k), date: d };
}
