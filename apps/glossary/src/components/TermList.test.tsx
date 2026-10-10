import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider, createTranslator } from '../i18n/i18n';
import type { Entry, Term } from '../terms';
import { TermList } from './TermList';

afterEach(cleanup);

const term = (id: string, en: string, ja: string, defJa: string): Term => ({
  id,
  en,
  ja,
  kana: 'あ',
  def: { ja: defJa, en: `${en} meaning` },
  example: { en: `${en} example`, ja: `${ja}の例` },
});
const ENTRIES: Entry[] = [
  { category: 'slang', term: term('nuts', 'Nuts', 'ナッツ', '最も強いハンド') },
  { category: 'action', term: term('3bet', '3-bet', 'スリーベット', 'さらにレイズ') },
  { category: 'position', term: term('button', 'Button', 'ボタン', 'ディーラーの位置') },
];

const renderList = (entries = ENTRIES, showCategory = true) =>
  render(
    <I18nProvider value={createTranslator('ja')}>
      <TermList entries={entries} showCategory={showCategory} />
    </I18nProvider>,
  );

describe('TermList', () => {
  it('shows letter headers with # first and rows in alphabetical order', () => {
    renderList();
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toBe('#');
    expect(items[1]).toContain('3-bet');
    expect(items[2]).toBe('B');
    expect(items[4]).toBe('N');
  });

  it('shows category tags only when asked', () => {
    renderList();
    expect(screen.getByText('アクション')).toBeTruthy();
    cleanup();
    renderList(ENTRIES, false);
    expect(screen.queryByText('アクション')).toBeNull();
  });

  it('filters by search and shows an empty message', () => {
    renderList();
    const box = screen.getByRole('searchbox');
    fireEvent.change(box, { target: { value: 'スリー' } });
    expect(screen.getByText('3-bet')).toBeTruthy();
    expect(screen.queryByText('Nuts')).toBeNull();
    fireEvent.change(box, { target: { value: 'zzz' } });
    expect(screen.getByText('見つかりません')).toBeTruthy();
  });

  it('opens one row at a time and closes it on a second tap', () => {
    renderList();
    const row = (name: RegExp) => screen.getByRole('button', { name });
    fireEvent.click(row(/Nuts/));
    expect(screen.getByText('最も強いハンド')).toBeTruthy();
    expect(row(/Nuts/).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(row(/Button/));
    expect(screen.queryByText('最も強いハンド')).toBeNull();
    expect(screen.getByText('ディーラーの位置')).toBeTruthy();
    fireEvent.click(row(/Button/));
    expect(screen.queryByText('ディーラーの位置')).toBeNull();
  });

  it('shows both example sentences in an open row', () => {
    renderList();
    fireEvent.click(screen.getByRole('button', { name: /Nuts/ }));
    const open = screen.getByText('最も強いハンド').closest('li')!;
    expect(within(open).getByText('Nuts example')).toBeTruthy();
    expect(within(open).getByText('ナッツの例')).toBeTruthy();
  });

  it('drops a stale open row when its entry is no longer listed', () => {
    const { rerender } = renderList();
    fireEvent.click(screen.getByRole('button', { name: /Nuts/ }));
    rerender(
      <I18nProvider value={createTranslator('ja')}>
        <TermList entries={ENTRIES.filter((e) => e.category === 'action')} showCategory={false} />
      </I18nProvider>,
    );
    expect(screen.queryByText('最も強いハンド')).toBeNull();
    rerender(
      <I18nProvider value={createTranslator('ja')}>
        <TermList entries={ENTRIES} showCategory />
      </I18nProvider>,
    );
    expect(screen.queryByText('最も強いハンド')).toBeNull();
  });
});
