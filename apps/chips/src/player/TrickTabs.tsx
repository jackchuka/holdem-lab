import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/i18n';
import type { Trick, TrickId } from '../tricks/types';

export function TrickTabs({ tricks, current, onSelect }: { tricks: Trick[]; current: TrickId; onSelect: (id: TrickId) => void }) {
  const { t, locale } = useI18n();
  const list = useRef<HTMLDivElement>(null);

  // Scroll only the tab row (never the page) so the selected trick stays visible once the tabs overflow.
  useEffect(() => {
    const row = list.current;
    const tab = row?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!row || !tab) return;
    if (tab.offsetLeft < row.scrollLeft) row.scrollLeft = tab.offsetLeft;
    else if (tab.offsetLeft + tab.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = tab.offsetLeft + tab.offsetWidth - row.clientWidth;
  }, [current]);

  return (
    <div className="tabs" role="tablist" aria-label={t('tabs.label')} ref={list}>
      {tricks.map((trick) => (
        <button key={trick.id} role="tab" className="tab" aria-selected={trick.id === current} onClick={() => onSelect(trick.id)}>
          {trick.name[locale]}
        </button>
      ))}
    </div>
  );
}
