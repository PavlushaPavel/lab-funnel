import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Choice } from '../../ui/Choice';
import { ChoiceList } from '../../ui/ChoiceList';
import { TextArea } from '../../ui/TextArea';
import { NodeLabel } from '../../ui/NodeLabel';
import { SCREENS } from '../../content/screens';
import { PRACTICE } from '../../content/practice';
import { MODULES } from '../../content/modules';
import { SPECIALIZATIONS } from '../../content/specializations';
import { getFearMotiveOptions } from '../../content/mechanics';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics, openLink } from '../../lib/telegram';
import { durations, easeOut, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS['m2-practice'];
const practice = PRACTICE['m2-practice'];
const MODULE = MODULES.m2;
const ASSISTANT_URL = import.meta.env.VITE_ASSISTANT_ADS_URL;

/** Честный порог «человек реально что-то вставил» — не проверка содержания, только факт ввода. */
const MIN_INPUT_LENGTH = 15;

/**
 * Практика по объявлениям (`m2-practice`, BRIEF.md §12, PRODUCT.md §3.4). Площадка — из
 * SPECIALIZATIONS[spec].platforms. Ассистент — VITE_ASSISTANT_ADS_URL с той же заглушкой,
 * что и в модуле 1.
 *
 * Раньше здесь был статичный список «что делаешь по пути» — приложение не знало, дошёл ли
 * человек до ассистента и вернулся ли с результатом (аудит продукта). Теперь единственное
 * доказательство работы — вставленный текст оффера (`setPracticeInput`) плюс выбор страха
 * или мотива, который использует этот оффер (варианты — из анализа ЦА текущей ниши,
 * content/mechanics.ts::getFearMotiveOptions). Контрольный вопрос брифа раскрывается только
 * после обоих — не вместо них. Слабый ответ «Просто красиво звучит» трясётся, показывает
 * деадпан-реакцию и не пускает дальше. Только верный ответ вызывает completeModule('m2') —
 * код на m2-code открывает лишь доступ к практике (ARCHITECTURE.md §3).
 */
export function M2PracticeScreen() {
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const next = useFunnelStore((s) => s.next);
  const setPractice = useFunnelStore((s) => s.setPractice);
  const setPracticeInput = useFunnelStore((s) => s.setPracticeInput);
  const completeModule = useFunnelStore((s) => s.completeModule);
  const practiceAnswer = useFunnelStore((s) => s.practice[practice.id]);
  const inputValue = useFunnelStore((s) => s.practiceInput[practice.id] ?? '');
  const reduced = useReducedMotionSafe();

  const platforms = SPECIALIZATIONS[spec].platforms;
  const fearMotiveOptions = getFearMotiveOptions(spec);

  const [platformId, setPlatformId] = useState<string | null>(null);
  const [fearMotiveId, setFearMotiveId] = useState<string | null>(null);
  const [answerId, setAnswerId] = useState<string | null>(practiceAnswer ?? null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [shakeTick, setShakeTick] = useState(0);

  const isInputValid = inputValue.trim().length >= MIN_INPUT_LENGTH;
  const readyForCheck = isInputValid && Boolean(fearMotiveId);

  const handleAssistant = () => {
    if (!ASSISTANT_URL) return;
    haptics.medium();
    track('assistant_open', { module: 'm2', platform: platformId });
    openLink(ASSISTANT_URL);
  };

  const handleAnswer = (id: string) => {
    if (!readyForCheck) return;
    const option = practice.checkOptions.find((o) => o.id === id);
    if (!option) return;

    if (option.isWeak) {
      haptics.error();
      setShakeId(id);
      setShakeTick((t) => t + 1);
      window.setTimeout(() => setShakeId(null), reduced ? 0 : durations.shake * 1000);
      return;
    }

    haptics.success();
    setAnswerId(id);
    setShakeId(null);
    setPractice(practice.id, id);
    // Модуль засчитывается пройденным только здесь — после реального ввода оффера, выбора
    // мотива и верного ответа на контрольный вопрос, а не при вводе кода (ARCHITECTURE.md §3).
    completeModule('m2');
    track('practice_complete', { module: 'm2', answer: id });
  };

  const handleNext = () => {
    haptics.medium();
    next();
  };

  const weakOption = practice.checkOptions.find((o) => o.isWeak);

  return (
    <Screen id="m2-practice" phase="want">
      <NodeLabel code={MODULE.code} title={MODULE.title} status="active" />
      <h1 className="t-display-l text-ink">{copy.title}</h1>

      <div className="grid gap-3">
        <span className="t-label text-ink-faint">ПЛОЩАДКА</span>
        <ChoiceList
          options={platforms}
          value={platformId}
          onChange={(id) => {
            haptics.select();
            setPlatformId(id);
          }}
        />
      </div>

      <div className="grid gap-2">
        <Button
          variant="secondary"
          full
          icon={<ArrowSquareOut weight="regular" size={20} aria-hidden="true" />}
          disabled={!ASSISTANT_URL || !platformId}
          onClick={handleAssistant}
        >
          Открыть ассистента
        </Button>
        {!ASSISTANT_URL && (
          <p className="t-body-s text-ink-muted">Ссылка на ассистента ещё не подключена.</p>
        )}
      </div>

      <div className="grid gap-3">
        <p className="t-body text-ink">{practice.inputPrompt}</p>
        <TextArea
          value={inputValue}
          onChange={(v) => setPracticeInput(practice.id, v)}
          placeholder={practice.inputPlaceholder}
          minLength={MIN_INPUT_LENGTH}
        />
      </div>

      <div className="grid gap-3">
        <span className="t-label text-ink-faint">КАКОЙ СТРАХ ИЛИ МОТИВ ОН ИСПОЛЬЗУЕТ</span>
        <div className="grid gap-2">
          {fearMotiveOptions.map((option, i) => (
            <Choice
              key={option.id}
              index={i}
              state={fearMotiveId === option.id ? 'selected' : 'idle'}
              onSelect={() => {
                haptics.select();
                setFearMotiveId(option.id);
              }}
            >
              {option.label}
            </Choice>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {readyForCheck && (
          <motion.div
            className="grid gap-3"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.26, ease: easeOut }}
          >
            <p className="t-body text-ink">{practice.checkQuestion}</p>
            <div className="grid gap-2">
              {practice.checkOptions.map((option, i) => (
                <Choice
                  key={shakeId === option.id ? `${option.id}-${shakeTick}` : option.id}
                  index={i}
                  state={shakeId === option.id ? 'wrong' : answerId === option.id ? 'selected' : 'idle'}
                  onSelect={() => handleAnswer(option.id)}
                >
                  {option.label}
                </Choice>
              ))}
            </div>
            {shakeId && weakOption && <p className="t-body-s text-bad">{weakOption.reaction}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomBar>
        <Button variant="primary" full disabled={!practiceAnswer} onClick={handleNext}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
