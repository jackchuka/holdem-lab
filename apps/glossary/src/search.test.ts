import { describe, expect, it } from 'vitest';
import { normalize, searchEntries } from './search';
import type { Entry, Term } from './terms';

const term = (over: Partial<Term>): Term => ({
  id: 'x',
  en: 'X',
  ja: 'エックス',
  kana: 'えっくす',
  def: { ja: '説明', en: 'meaning' },
  example: { en: 'e', ja: 'え' },
  ...over,
});
const entries: Entry[] = [
  { category: 'action', term: term({ id: '3bet', en: '3-bet', ja: 'スリーベット', kana: 'すりーべっと', aliases: ['reraise'], def: { ja: 'オープンレイズに対してさらにレイズ', en: 'A re-raise over an open raise.' } }) },
  { category: 'math', term: term({ id: 'spr', en: 'SPR', ja: 'SPR', kana: 'えすぴーあーる', def: { ja: 'スタックとポットの比率', en: 'Stack-to-pot ratio.' } }) },
];
const ids = (q: string) => searchEntries(entries, q).map((e) => e.term.id);

describe('normalize', () => {
  it('folds width, case, katakana and separators', () => {
    expect(normalize('３－ＢＥＴ')).toBe('3bet');
    expect(normalize('スリー・ベット')).toBe('すりーべっと');
    expect(normalize(' 3 bet ')).toBe('3bet');
  });
});

describe('searchEntries', () => {
  it('matches en, ja, kana, aliases and both definitions', () => {
    expect(ids('3bet')).toEqual(['3bet']);
    expect(ids('3-Bet')).toEqual(['3bet']);
    expect(ids('すりー')).toEqual(['3bet']);
    expect(ids('スリー')).toEqual(['3bet']);
    expect(ids('reraise')).toEqual(['3bet']);
    expect(ids('比率')).toEqual(['spr']);
    expect(ids('stack-to-pot')).toEqual(['spr']);
  });

  it('returns everything for an empty or separator-only query', () => {
    expect(ids('')).toEqual(['3bet', 'spr']);
    expect(ids(' - ・')).toEqual(['3bet', 'spr']);
  });

  it('returns nothing when no field matches', () => {
    expect(ids('zzz')).toEqual([]);
  });
});
