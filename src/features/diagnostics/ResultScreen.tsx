import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { Well } from '../../ui/Well';
import { Readout } from '../../ui/Readout';
import { Prose } from '../../ui/Prose';
import { LeakScanner } from '../../mechanics/LeakScanner';
import { createLeakScannerData, type LeakSegmentId } from '../../content/mechanics';
import { RESULTS } from '../../content/results';
import { SPECIALIZATIONS } from '../../content/specializations';
import { QUIZ_QUESTIONS } from '../../content/quiz';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';

/** Локальные тайминги оркестрации: вердикт -> скан -> счётчик утечки (задача волны, не в lib/motion.ts). */
const RESULT_MOTION = {
  verdictDuration: 0.32,
  scanDelay: 0.2,
  scanDuration: 0.32,
  wellDuration: 0.32,
} as const;

function isCorrect(answers: Record<number, number>, qIndex: number): boolean {
  const q = QUIZ_QUESTIONS[qIndex];
  const a = answers[qIndex];
  return a !== undefined && q.options[a]?.id === q.correctId;
}

/**
 * Сегменты воронки, которые пользователь контролирует, по правилам задачи:
 * вопрос 2 (индекс 2) -> «аудитория», вопрос 3 (индекс 3) -> «сообщение»,
 * вопросы 1 и 4 (индексы 1 и 4) вместе -> «посадочная», вопрос 5 (индекс 5) -> «после заявки».
 */
function computeControlledIds(answers: Record<number, number>): LeakSegmentId[] {
  const ids: LeakSegmentId[] = [];
  if (isCorrect(answers, 2)) ids.push('audience');
  if (isCorrect(answers, 3)) ids.push('message');
  if (isCorrect(answers, 1) && isCorrect(answers, 4)) ids.push('landing');
  if (isCorrect(answers, 5)) ids.push('afterLead');
  return ids;
}

/**
 * Результат теста (`result`) — самый важный экран группы: здесь проблема связывается
 * с деньгами. Композиция сверху вниз: вердикт -> LeakScanner -> колодец утечки,
 * появление оркестровано, не всё сразу (PRODUCT.md §4.3, §3.1).
 */
export function ResultScreen() {
  const tier = useFunnelStore((s) => s.tier) ?? 'low';
  const score = useFunnelStore((s) => s.score);
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const leakBase = useFunnelStore((s) => s.leakBase);
  const quizAnswers = useFunnelStore((s) => s.quizAnswers);
  const completeMechanic = useFunnelStore((s) => s.completeMechanic);
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const result = RESULTS[tier];
  const specCopy = SPECIALIZATIONS[spec];
  const leakData = useMemo(() => createLeakScannerData(computeControlledIds(quizAnswers)), [quizAnswers]);

  const [scanDone, setScanDone] = useState(false);

  useEffect(() => {
    track('quiz_result', { tier, score, leakBase });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- фиксируем ровно один раз при монтаже результата
  }, []);

  const handleScanComplete = () => {
    completeMechanic('leak-scan');
    setScanDone(true);
  };

  const handleCta = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="result" phase="know">
      <motion.div
        className="grid gap-3"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: RESULT_MOTION.verdictDuration, ease: easeOut }}
      >
        <h1 className="t-display-l text-ink">{result.title}</h1>
        <Prose>
          {result.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Prose>
      </motion.div>

      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: RESULT_MOTION.scanDuration,
          ease: easeOut,
          delay: reduced ? 0 : RESULT_MOTION.scanDelay,
        }}
      >
        <Panel label="СКАН · ФОКУС" status={scanDone ? 'done' : 'scanning'}>
          <LeakScanner data={leakData} spec={spec} onComplete={handleScanComplete} />
        </Panel>
      </motion.div>

      <AnimatePresence>
        {scanDone && (
          <motion.div
            className="grid gap-2"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: RESULT_MOTION.wellDuration, ease: easeOut }}
          >
            <p className="t-label text-ink-faint">УТЕЧКА · ₽ / МЕС</p>
            <Well>
              <div className="grid gap-1">
                <div style={{ color: 'var(--rust)' }}>
                  <Readout value={leakBase} suffix="₽" size="lg" />
                </div>
                <p className="t-label text-ink-faint">ОЦЕНКА. НЕ ОБЕЩАНИЕ.</p>
              </div>
            </Well>
            <p className="t-body-s text-ink-muted">{specCopy.losing}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomBar>
        <Button variant="primary" full onClick={handleCta}>
          {result.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
