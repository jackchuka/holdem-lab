import type { Card } from '@holdem-lab/engine';
import { BoardRow, CardPicker } from '@holdem-lab/ui';
import { useI18n } from '../i18n/i18n';

type Props = { board: Card[]; used: Set<Card>; onChange: (b: Card[]) => void; onDone: () => void };

export function BoardEditor({ board, used, onChange, onDone }: Props) {
  const { t } = useI18n();
  const pick = (c: Card) => {
    if (board.includes(c)) onChange(board.filter((x) => x !== c));
    else if (board.length < 5) onChange([...board, c]);
  };
  return (
    <div className="editor">
      <BoardRow cards={board} />
      <CardPicker disabled={used} selected={new Set(board)} onPick={pick} />
      <div className="editor-actions">
        <button className="secondary" onClick={() => onChange([])}>
          {t('board.clear')}
        </button>
        <button className="primary" onClick={onDone}>
          {t('board.done')}
        </button>
      </div>
    </div>
  );
}
