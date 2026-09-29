import { useEffect, useRef, useState } from 'react';
import { categoryText, type Question, type Response } from '@holdem-lab/quiz';
import { BoardRow, HeroHand } from '@holdem-lab/ui';
import { useI18n } from '../i18n/i18n';
import type { AnswerResult } from '../session/runner';
import { ContextView } from './ContextView';
import { ResultPanel } from './ResultPanel';

type Props = {
  question: Question;
  progress: { index: number; total: number };
  result: AnswerResult | null;
  onAnswer: (r: Response) => void;
  onNext: () => void;
  advancing?: boolean;
  onQuit: () => void;
};

export function QuestionScreen({ question, progress, result, onAnswer, onNext, advancing, onQuit }: Props) {
  const { t, text } = useI18n();
  const shownAt = useRef(performance.now());
  const [answered, setAnswered] = useState(false);
  const [value, setValue] = useState(50);

  useEffect(() => {
    shownAt.current = performance.now();
    setAnswered(false);
    setValue(50);
  }, [question]);

  const submit = (r: Omit<Response, 'elapsedMs'>) => {
    if (answered || result) return;
    setAnswered(true);
    onAnswer({ ...r, elapsedMs: Math.round(performance.now() - shownAt.current) });
  };

  const pct = progress.total ? (progress.index / progress.total) * 100 : 0;

  return (
    <main className="stage">
      <div className="zone zone-top">
        <div className="progress">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="stage-meta">
          <span data-testid="progress">
            {progress.index} / {progress.total}
          </span>
          <span>{text(categoryText(question.category))}</span>
          <button className="quit" aria-label={t('stage.quit')} onClick={onQuit}>
            ✕
          </button>
        </div>
      </div>
      <div className="zone zone-context">
        <ContextView context={question.stage.context} />
      </div>
      <div className="zone zone-board">
        <span className="zone-label">BOARD</span>
        <BoardRow cards={question.stage.board} />
      </div>
      <div className="zone zone-hero">
        <span className="zone-label">YOU</span>
        <HeroHand cards={question.stage.hero} />
      </div>
      {result ? (
        <ResultPanel result={result} onNext={onNext} advancing={advancing} />
      ) : (
        <>
          <div className="zone zone-prompt">
            <p className="prompt">{text(question.prompt)}</p>
          </div>
          <div className="zone zone-answer">
            {question.answer.kind === 'numeric' ? (
              <>
                <div className="slider-value">{value}%</div>
                <input
                  className="slider"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={value}
                  aria-label={t('stage.slider')}
                  onChange={(e) => setValue(Number(e.target.value))}
                />
                <button className="primary" disabled={answered} onClick={() => submit({ value })}>
                  {t('stage.submit')}
                </button>
              </>
            ) : (
              <div className="choices">
                {question.choices!.map((c, i) => (
                  <button key={c.label} className="choice" disabled={answered} onClick={() => submit({ choiceIndex: i })}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
