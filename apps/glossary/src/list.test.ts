import { describe, expect, it } from 'vitest';
import { groupByLetter, sortByEn } from './list';
import type { Entry } from './terms';

const e = (en: string): Entry => ({
  category: 'slang',
  term: { id: en.toLowerCase(), en, ja: en, kana: 'あ', def: { ja: 'a', en: 'a' }, example: { en: 'a', ja: 'a' } },
});

describe('sortByEn', () => {
  it('sorts case-insensitively and puts non-letters first', () => {
    expect(sortByEn([e('nuts'), e('Button'), e('3-bet'), e('ante')]).map((x) => x.term.en)).toEqual(['3-bet', 'ante', 'Button', 'nuts']);
  });
});

describe('groupByLetter', () => {
  it('groups by first letter and files non-letters under #', () => {
    const groups = groupByLetter(sortByEn([e('3-bet'), e('6-max'), e('Button'), e('bad beat'), e('Nuts')]));
    expect(groups.map((g) => [g.letter, g.entries.length])).toEqual([
      ['#', 2],
      ['B', 2],
      ['N', 1],
    ]);
  });

  it('returns no groups for no entries', () => {
    expect(groupByLetter([])).toEqual([]);
  });
});
