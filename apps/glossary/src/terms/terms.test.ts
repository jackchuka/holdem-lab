import { describe, expect, it } from 'vitest';
import { searchEntries } from '../search';
import { CATEGORIES, ENTRIES } from './index';

describe('term data', () => {
  it('has unique ids in the agreed format', () => {
    const ids = ENTRIES.map((e) => e.term.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('fills every text field', () => {
    for (const { term: t } of ENTRIES) {
      for (const v of [t.en, t.ja, t.kana, t.def.ja, t.def.en, t.example.en, t.example.ja]) {
        expect(v.trim(), t.id).not.toBe('');
      }
      for (const a of t.aliases ?? []) expect(a.trim(), t.id).not.toBe('');
    }
  });

  it('writes readings in hiragana', () => {
    for (const { term: t } of ENTRIES) expect(t.kana, t.id).toMatch(/^[ぁ-ゖー]+$/);
  });

  it('puts every entry in a known category', () => {
    for (const e of ENTRIES) expect(CATEGORIES).toContain(e.category);
    expect(ENTRIES.some((e) => e.category === 'position')).toBe(true);
  });

  it('finds raises by their usual Japanese spelling', () => {
    for (const [q, id] of [['3ベット', '3-bet'], ['4ベット', '4-bet'], ['5ベット', '5-bet']]) {
      expect(searchEntries(ENTRIES, q).map((e) => e.term.id), q).toContain(id);
    }
  });
});
