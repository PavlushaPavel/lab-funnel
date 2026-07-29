import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { ChoiceList } from '../../ui/ChoiceList';
import { TickRail } from '../../ui/TickRail';
import { QUIZ_QUESTIONS } from '../../content/quiz';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

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
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <TickRail progress={progress} height={12} />
        <span className="t-label text-ink-faint">
          ВОПРОС {String(index + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
        </span>
      </div>

      <h1 className="t-h1 text-ink">{question.question}</h1>

      <ChoiceList
        options={question.options}
        value={selectedId}
        onChange={handleAnswer}
        revealCorrect={isAnswered ? question.correctId : undefined}
      />

      {isAnswered && <p className="t-body-s text-ink-muted">{question.explain}</p>}

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
