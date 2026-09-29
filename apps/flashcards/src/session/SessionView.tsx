import { useCallback, useEffect, useRef, useState } from 'react';
import type { Question, Response } from '@holdem-lab/quiz';
import { useI18n } from '../i18n/i18n';
import { QuestionScreen } from '../screens/QuestionScreen';
import type { AnswerResult, SessionRunner, SessionSummary } from './runner';

type Props = { runner: SessionRunner; onFinish: (s: SessionSummary) => void; onQuit: () => void };

export function SessionView({ runner, onFinish, onQuit }: Props) {
  const { t } = useI18n();
  const [question, setQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const started = useRef(false);
  const advancingRef = useRef(false);

  const advance = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);
    try {
      const q = await runner.next();
      if (!q) {
        onFinish(runner.summary());
        return;
      }
      setResult(null);
      setQuestion(q);
    } finally {
      advancingRef.current = false;
      setAdvancing(false);
    }
  }, [runner, onFinish]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void advance();
  }, [advance]);

  if (!question) return <main className="stage stage-loading">{t('stage.loading')}</main>;

  return (
    <QuestionScreen
      question={question}
      progress={runner.progress}
      result={result}
      onAnswer={async (r: Response) => {
        try {
          setResult(await runner.answer(r));
        } catch (e) {
          console.error(e);
          void advance();
        }
      }}
      onNext={advance}
      advancing={advancing}
      onQuit={onQuit}
    />
  );
}
