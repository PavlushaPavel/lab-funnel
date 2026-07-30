import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { motion } from 'motion/react';
import { ChoiceList } from '../../ui/ChoiceList';
import { QUIZ_QUESTIONS } from '../../content/quiz';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { springPanel, useReducedMotionSafe } from '../../lib/motion';

const TOTAL = QUIZ_QUESTIONS.length;

/**
 * Тест (`quiz`): один вопрос на экран, 6 вопросов.
 *
 * Текущий вопрос живёт в сторе (`quizIndex` + `setQuizIndex`), а не в локальном состоянии:
 * стор персистится, поэтому человек, закрывший Telegram на четвёртом вопросе,
 * возвращается на четвёртый, а не на первый.
 */
export function QuizScreen() {
  const index = useFunnelStore((s) => s.quizIndex);
  const setQuizIndex = useFunnelStore((s) => s.setQuizIndex);
  const quizAnswers = useFunnelStore((s) => s.quizAnswers);
  const answerQuiz = useFunnelStore((s) => s.answerQuiz);
  const finishQuiz = useFunnelStore((s) => s.finishQuiz);
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const question = QUIZ_QUESTIONS[index];
  const answeredOptIndex = quizAnswers[index];
  const isAnswered = answeredOptIndex !== undefined;
  const selectedId = isAnswered ? (question.options[answeredOptIndex]?.id ?? null) : null;
  const isLast = index === TOTAL - 1;
  const progress = index / (TOTAL - 1);

  const handleAnswer = (optionId: string) => {
    if (isAnswered) return;
    const optIndex = question.options.findIndex((o) => o.id === optionId);
    if (optIndex === -1) return;
    answerQuiz(index, optIndex);
    track('quiz_answer', { question: index, optionId, correct: optionId === question.correctId });
  };

  const handleBack = () => {
    if (index === 0) return;
    haptics.select();
    setQuizIndex(index - 1);
  };

  const handleNext = () => {
    if (!isAnswered) return;
    if (isLast) {
      haptics.medium();
      finishQuiz();
      track('quiz_complete');
      next();
      return;
    }
    haptics.light();
    setQuizIndex(index + 1);
  };

  return (
    <Screen id="quiz" phase="know">
      {/* Прогресс теста — тонкая линия 3px (DESIGN.md §6 ProgressRail): трек --hairline,
          пройденная часть --ink. Калибровочной шкалы v1/v2 в этом мире нет. */}
      <div className="grid gap-2">
        <p className="t-caption tnum">
          ВОПРОС {String(index + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
        </p>
        <div
          className="h-[3px] w-full overflow-hidden rounded-pill bg-hairline"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="h-full rounded-pill bg-ink"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={reduced ? { duration: 0 } : springPanel}
          />
        </div>
      </div>

      <h1 className="t-heading text-ink">{question.question}</h1>

      <ChoiceList
        options={question.options}
        value={selectedId}
        onChange={handleAnswer}
        revealCorrect={isAnswered ? question.correctId : undefined}
      />

      {/* Разбор ответа. Цвет верно/неверно несёт сам Choice (--mint / --alert, §6),
          разбор остаётся спокойным текстом на белой карточке. */}
      {isAnswered && (
        <motion.div
          key={index}
          className="rounded-card bg-card"
          style={{ padding: 'var(--card-pad)' }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0.12 } : springPanel}
        >
          <p className="t-body-sm text-ink-secondary">{question.explain}</p>
        </motion.div>
      )}

      <BottomBar>
        {index > 0 ? (
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <Button variant="secondary" onClick={handleBack}>
              Назад
            </Button>
            <Button variant="primary" full disabled={!isAnswered} onClick={handleNext}>
              Дальше
            </Button>
          </div>
        ) : (
          <Button variant="primary" full disabled={!isAnswered} onClick={handleNext}>
            Дальше
          </Button>
        )}
      </BottomBar>
    </Screen>
  );
}
