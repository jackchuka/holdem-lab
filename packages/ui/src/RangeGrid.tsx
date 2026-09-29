import { useEffect, useRef, useState } from 'react';
import { HAND_CLASSES, type HandClass } from '@holdem-lab/engine';

export type RangeGridProps = {
  range: ReadonlyMap<HandClass, number>;
  onChange?: (next: Map<HandClass, number>) => void;
  overlay?: Readonly<Record<HandClass, string>>;
  onCellTap?: (hc: HandClass) => void;
  label?: string;
  highlight?: HandClass;
  showLabels?: boolean;
};

export function RangeGrid({ range, onChange, overlay, onCellTap, label, highlight, showLabels = true }: RangeGridProps) {
  const draft = useRef<Map<HandClass, number> | null>(null);
  const painting = useRef(true);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;
    const end = () => {
      draft.current = null;
      setDragging(false);
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [dragging]);

  const apply = (hc: HandClass) => {
    const next = new Map(draft.current ?? range);
    if (painting.current) next.set(hc, 1);
    else next.delete(hc);
    draft.current = next;
    onChange?.(next);
  };

  return (
    <div className={`hl-range-grid${onChange ? ' hl-range-grid--edit' : ''}`} role="grid" aria-label={label}>
      {HAND_CLASSES.map((hc) => {
        const w = range.get(hc) ?? 0;
        return (
          <div
            key={hc}
            role="gridcell"
            data-hc={hc}
            data-state={w >= 1 ? 'in' : w > 0 ? 'mixed' : 'out'}
            data-highlight={hc === highlight || undefined}
            title={showLabels ? undefined : hc}
            aria-selected={w > 0}
            style={overlay?.[hc] ? { background: overlay[hc] } : undefined}
            onPointerDown={
              onChange
                ? (e) => {
                    (e.target as Element).releasePointerCapture?.(e.pointerId);
                    painting.current = !range.has(hc);
                    draft.current = null;
                    setDragging(true);
                    apply(hc);
                  }
                : undefined
            }
            onPointerEnter={onChange && dragging ? () => apply(hc) : undefined}
            onClick={onCellTap ? () => onCellTap(hc) : undefined}
          >
            {showLabels && hc}
          </div>
        );
      })}
    </div>
  );
}
