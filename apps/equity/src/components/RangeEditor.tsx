import { useState, type ReactNode } from 'react';
import {
  POSITIONS,
  comboStats,
  formatRange,
  parseRange,
  sameRange,
  type Position,
  type RangeParseError,
  type WeightedRange,
} from '@holdem-lab/ranges';
import { RangeGrid } from '@holdem-lab/ui';
import { useI18n } from '../i18n/i18n';

export type Presets = Record<Position, WeightedRange> | null;
type Props = { range: WeightedRange; presets: Presets; onChange: (r: WeightedRange) => void };

function underline(text: string, errors: RangeParseError[]): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  errors.forEach((e, i) => {
    out.push(text.slice(at, e.start), <u key={i}>{text.slice(e.start, e.end)}</u>);
    at = e.end;
  });
  out.push(text.slice(at));
  return out;
}

export function RangeEditor({ range, presets, onChange }: Props) {
  const { t } = useI18n();
  const [text, setText] = useState(() => formatRange(range));
  const [errors, setErrors] = useState<RangeParseError[]>([]);
  const replace = (r: WeightedRange) => {
    setText(formatRange(r));
    setErrors([]);
    onChange(r);
  };
  const type = (value: string) => {
    const parsed = parseRange(value);
    setText(value);
    setErrors(parsed.errors);
    onChange(parsed.range);
  };
  const { combos, percent } = comboStats(range);
  return (
    <div className="editor">
      {presets && (
        <div className="chips">
          {POSITIONS.map((p) => (
            <button key={p} className="chip" aria-pressed={sameRange(range, presets[p])} onClick={() => replace(presets[p])}>
              {p}
            </button>
          ))}
          <button className="chip" onClick={() => replace(new Map())}>
            {t('range.clear')}
          </button>
        </div>
      )}
      <input
        className="notation"
        aria-label={t('range.notation')}
        value={text}
        onChange={(e) => type(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {errors.length > 0 && <p className="notation-errors">{underline(text, errors)}</p>}
      <RangeGrid range={range} onChange={replace} label={t('kind.range')} />
      <p className="muted">{t('range.stats', { combos: Math.round(combos * 10) / 10, pct: percent.toFixed(1) })}</p>
    </div>
  );
}
