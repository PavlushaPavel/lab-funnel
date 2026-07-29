import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { ChoiceList } from '../../ui/ChoiceList';
import { TextArea } from '../../ui/TextArea';
import { NodeLabel } from '../../ui/NodeLabel';
import { SCREENS } from '../../content/screens';
import { PRACTICE } from '../../content/practice';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics, openLink } from '../../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS['m1-practice'];
const practice = PRACTICE['m1-practice'];
const MODULE = MODULES.m1;
const ASSISTANT_URL = import.meta.env.VITE_ASSISTANT_CA_URL;

/** Честный порог «человек реально что-то написал» — не проверка содержания, только факт ввода. */
const MIN_INPUT_LENGTH = 15;

/**
 * Практика по ЦА (`m1-practice`, BRIEF.md §8, PRODUCT.md §3.4). Выбор проекта → ассистент
 * (заглушка, если VITE_ASSISTANT_CA_URL не задан — приложение не падает) → человек вставляет
 * реальный результат работы с ассистентом → контрольный вопрос брифа.
 *
 * Раньше здесь был чекбокс-чеклист «что делаешь по пути» — приложение не знало, сделал ли
 * человек хоть что-то, только что он потыкал галочки (аудит продукта). Теперь единственное
 * доказательство работы — свободный текст (`setPracticeInput`), не короче MIN_INPUT_LENGTH
 * символов. Контрольный вопрос раскрывается только после него, а не вместо него.
 * completeModule('m1') вызывается только после ответа на контрольный вопрос, то есть уже
 * после того, как реальный ввод пройден (ARCHITECTURE.md §3).
 */
export function M1PracticeScreen() {
  const next = useFunnelStore((s) => s.next);
  const setPractice = useFunnelStore((s) => s.setPractice);
  const setPracticeInput = useFunnelStore((s) => s.setPracticeInput);
  const completeModule = useFunnelStore((s) => s.completeModule);
  const practiceAnswer = useFunnelStore((s) => s.practice[practice.id]);
  const inputValue = useFunnelStore((s) => s.practiceInput[practice.id] ?? '');
  const reduced = useReducedMotionSafe();

  const [sourceId, setSourceId] = useState<string | null>(null);

  const isInputValid = inputValue.trim().length >= MIN_INPUT_LENGTH;

  const handleAssistant = () => {
    if (!ASSISTANT_URL) return;
    haptics.medium();
    track('assistant_open', { module: 'm1', source: sourceId });
    openLink(ASSISTANT_URL);
  };

  const handleAnswer = (id: string) => {
    if (!isInputValid) return;
    haptics.light();
    setPractice(practice.id, id);
    // Модуль засчитывается пройденным только здесь — после реального ввода результата
    // и ответа на контрольный вопрос, а не при вводе кода (ARCHITECTURE.md §3).
    completeModule('m1');
    track('practice_complete', { module: 'm1', answer: id });
  };

  const handleNext = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="m1-practice" phase="want">
      <NodeLabel code={MODULE.code} title={MODULE.title} status="active" />
      <h1 className="t-display-l text-ink">{copy.title}</h1>

      <div className="grid gap-3">
        <span className="t-label text-ink-faint">КАКОЙ ПРОЕКТ БЕРЁМ</span>
        <ChoiceList
          options={practice.sourceOptions}
          value={sourceId}
          onChange={(id) => {
            haptics.select();
            setSourceId(id);
          }}
        />
      </div>

      <div className="grid gap-2">
        <Button
          variant="secondary"
          full
          icon={<ArrowSquareOut weight="regular" size={20} aria-hidden="true" />}
          disabled={!ASSISTANT_URL || !sourceId}
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

      <AnimatePresence>
        {isInputValid && (
          <motion.div
            className="grid gap-3"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.26, ease: easeOut }}
          >
            <p className="t-body text-ink">{practice.checkQuestion}</p>
            <ChoiceList options={practice.checkOptions} value={practiceAnswer ?? null} onChange={handleAnswer} />
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
