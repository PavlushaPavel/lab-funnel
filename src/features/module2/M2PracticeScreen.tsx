import { useState } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Choice } from '../../ui/Choice';
import { ChoiceList } from '../../ui/ChoiceList';
import { Panel } from '../../ui/Panel';
import { Bullets } from '../../ui/Bullets';
import { NodeLabel } from '../../ui/NodeLabel';
import { SCREENS } from '../../content/screens';
import { PRACTICE } from '../../content/practice';
import { MODULES } from '../../content/modules';
import { SPECIALIZATIONS } from '../../content/specializations';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics, openLink } from '../../lib/telegram';
import { durations, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS['m2-practice'];
const practice = PRACTICE['m2-practice'];
const MODULE = MODULES.m2;
const ASSISTANT_URL = import.meta.env.VITE_ASSISTANT_ADS_URL;

/**
 * Практика по объявлениям (`m2-practice`, BRIEF.md §12). Площадка — из
 * SPECIALIZATIONS[spec].platforms (уже персонализирована и отсортирована). Ассистент —
 * VITE_ASSISTANT_ADS_URL с той же заглушкой, что и в модуле 1. Контрольный вопрос: слабый
 * ответ «Просто красиво звучит» трясётся, показывает деадпан-реакцию и не пускает дальше —
 * вопрос нужно решить заново.
 */
export function M2PracticeScreen() {
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const next = useFunnelStore((s) => s.next);
  const setPractice = useFunnelStore((s) => s.setPractice);
  const practiceAnswer = useFunnelStore((s) => s.practice[practice.id]);
  const reduced = useReducedMotionSafe();

  const platforms = SPECIALIZATIONS[spec].platforms;
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [answerId, setAnswerId] = useState<string | null>(practiceAnswer ?? null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [shakeTick, setShakeTick] = useState(0);

  const handleAssistant = () => {
    if (!ASSISTANT_URL) return;
    haptics.medium();
    track('assistant_open', { module: 'm2', platform: platformId });
    openLink(ASSISTANT_URL);
  };

  const handleAnswer = (id: string) => {
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

      <Panel label="ЧТО ДЕЛАЕШЬ ПО ПУТИ">
        <Bullets items={practice.steps} />
      </Panel>

      <div className="grid gap-3">
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
      </div>

      <BottomBar>
        <Button variant="primary" full disabled={!practiceAnswer} onClick={handleNext}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
