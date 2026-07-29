import { useState } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Choice } from '../../ui/Choice';
import { ChoiceList } from '../../ui/ChoiceList';
import { NodeLabel } from '../../ui/NodeLabel';
import { SCREENS } from '../../content/screens';
import { PRACTICE } from '../../content/practice';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics, openLink } from '../../lib/telegram';

const copy = SCREENS['m1-practice'];
const practice = PRACTICE['m1-practice'];
const MODULE = MODULES.m1;
const ASSISTANT_URL = import.meta.env.VITE_ASSISTANT_CA_URL;

/**
 * Практика по ЦА (`m1-practice`, BRIEF.md §8, PRODUCT.md §4.1 «применение»). Выбор проекта →
 * ассистент (заглушка, если VITE_ASSISTANT_CA_URL не задан — приложение не падает) →
 * интерактивный чек-лист шагов → контрольный вопрос → setPractice + track('practice_complete').
 */
export function M1PracticeScreen() {
  const next = useFunnelStore((s) => s.next);
  const setPractice = useFunnelStore((s) => s.setPractice);
  const practiceAnswer = useFunnelStore((s) => s.practice[practice.id]);

  const [sourceId, setSourceId] = useState<string | null>(null);
  const [stepsDone, setStepsDone] = useState<boolean[]>(() => practice.steps.map(() => false));

  const handleAssistant = () => {
    if (!ASSISTANT_URL) return;
    haptics.medium();
    track('assistant_open', { module: 'm1', source: sourceId });
    openLink(ASSISTANT_URL);
  };

  const toggleStep = (i: number) => {
    haptics.light();
    setStepsDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const handleAnswer = (id: string) => {
    haptics.light();
    setPractice(practice.id, id);
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
          Попробовать ассистента
        </Button>
        {!ASSISTANT_URL && (
          <p className="t-body-s text-ink-faint">Ссылка на ассистента ещё не подключена.</p>
        )}
      </div>

      <div className="grid gap-3">
        <span className="t-label text-ink-faint">ЧТО ДЕЛАЕШЬ ПО ПУТИ</span>
        <div className="grid gap-2">
          {practice.steps.map((step, i) => (
            <Choice
              key={i}
              index={i}
              state={stepsDone[i] ? 'selected' : 'idle'}
              onSelect={() => toggleStep(i)}
            >
              {step}
            </Choice>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <p className="t-body text-ink">{practice.checkQuestion}</p>
        <ChoiceList options={practice.checkOptions} value={practiceAnswer ?? null} onChange={handleAnswer} />
      </div>

      <BottomBar>
        <Button variant="primary" full disabled={!practiceAnswer} onClick={handleNext}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
