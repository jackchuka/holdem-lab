import type { Entry } from './terms';

export type LetterGroup = { letter: string; entries: Entry[] };

const letterOf = (en: string): string => {
  const c = en[0]?.toUpperCase() ?? '';
  return c >= 'A' && c <= 'Z' ? c : '#';
};

export function sortByEn(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const la = letterOf(a.term.en);
    const lb = letterOf(b.term.en);
    if ((la === '#') !== (lb === '#')) return la === '#' ? -1 : 1;
    return a.term.en.localeCompare(b.term.en, 'en', { sensitivity: 'base', numeric: true });
  });
}

export function groupByLetter(sorted: Entry[]): LetterGroup[] {
  const groups: LetterGroup[] = [];
  for (const entry of sorted) {
    const letter = letterOf(entry.term.en);
    const last = groups.at(-1);
    if (last?.letter === letter) last.entries.push(entry);
    else groups.push({ letter, entries: [entry] });
  }
  return groups;
}
