import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/i18n';
import { groupByLetter, sortByEn } from '../list';
import { searchEntries } from '../search';
import type { Entry } from '../terms';
import { Example } from './Example';

export function TermList({ entries, showCategory }: { entries: Entry[]; showCategory: boolean }) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const groups = useMemo(() => groupByLetter(sortByEn(searchEntries(entries, query))), [entries, query]);

  // A row hidden by the category or the search is closed for good, not reopened when it comes back.
  useEffect(() => {
    if (open && !groups.some((g) => g.entries.some((e) => e.term.id === open))) setOpen(null);
  }, [groups, open]);

  return (
    <>
      <label className="search">
        <span aria-hidden="true">🔍</span>
        <input id="glossary-search" type="search" placeholder={t('list.search')} aria-label={t('list.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <ul className="term-list">
        {groups.length === 0 && <li className="empty">{t('list.empty')}</li>}
        {groups.flatMap((g) => [
          <li key={`letter-${g.letter}`} className="letter">
            {g.letter}
          </li>,
          ...g.entries.map(({ term, category }) => {
            const isOpen = open === term.id;
            return (
              <li key={term.id} className={isOpen ? 'row open' : 'row'}>
                <button aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : term.id)}>
                  <span className="row-en" lang="en">
                    {term.en}
                  </span>
                  <span className="row-ja" lang="ja">
                    {term.ja}
                  </span>
                  {showCategory && <span className="tag">{t(`category.${category}`)}</span>}
                  <span className="chev" aria-hidden="true">
                    ›
                  </span>
                </button>
                {isOpen && (
                  <div className="detail">
                    <span>{term.def[locale]}</span>
                    <Example term={term} />
                  </div>
                )}
              </li>
            );
          }),
        ])}
      </ul>
    </>
  );
}
