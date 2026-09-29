import { RangeGrid } from '@holdem-lab/ui';
import { useI18n } from '../i18n/i18n';
import type { AnswerResult } from '../session/runner';

export function ResultPanel({ result, onNext, advancing }: { result: AnswerResult; onNext: () => void; advancing?: boolean }) {
  const { t, text } = useI18n();
  const { question, response, correct, error } = result;
  const { explanation } = question;
  const chosen = response.choiceIndex !== undefined ? question.choices?.[response.choiceIndex] : undefined;
  return (
    <section className="result-panel" aria-live="polite">
      <div className={`result-head ${correct ? 'ok' : 'ng'}`}>
        {t(correct ? 'result.correct' : 'result.wrong')}　{text(explanation.headline)}
      </div>
      {question.answer.kind === 'numeric' && response.value !== undefined && (
        <div>{t('result.yourAnswer', { value: response.value, error: (error ?? 0).toFixed(1) })}</div>
      )}
      {!correct && chosen?.mistake && <div>{text(chosen.mistake)}</div>}
      <div className="result-lines">
        {explanation.lines.map((l, i) => (
          <div key={i}>{text(l)}</div>
        ))}
      </div>
      {explanation.grid && (
        <div className="result-grid">
          <RangeGrid
            range={new Map(Object.entries(explanation.grid.raise).filter(([, w]) => w > 0))}
            highlight={explanation.grid.highlight}
            label={t('result.rangeGrid')}
          />
        </div>
      )}
      <button className="primary" data-testid="next" disabled={advancing} onClick={onNext}>
        {t('result.next')}
      </button>
    </section>
  );
}
