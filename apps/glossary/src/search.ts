import type { Entry } from './terms';

const KATAKANA = /[ァ-ヶ]/g;
const SEPARATORS = /[\s\-‐‑–—・･]/g;

export function normalize(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(KATAKANA, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(SEPARATORS, '');
}

export function searchEntries(entries: Entry[], query: string): Entry[] {
  const q = normalize(query);
  if (!q) return entries;
  return entries.filter(({ term: t }) => [t.en, t.ja, t.kana, t.def.ja, t.def.en, ...(t.aliases ?? [])].some((f) => normalize(f).includes(q)));
}
