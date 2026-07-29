import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Prose } from '../../ui/Prose';
import { CodeInput } from '../../ui/CodeInput';
import { ScanLine } from '../../ui/ScanLine';
import { ElementTile } from '../../ui/ElementTile';
import type { ElementState } from '../../ui/ElementTile';
import { MODULES, moduleMass } from '../../content/modules';
import type { ScreenCopy } from '../../content/types';
import { useFunnelStore } from '../../store/funnel';
import type { ModuleId, Phase, StepId } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { durations, easeOut, useReducedMotionSafe } from '../../lib/motion';

interface CodeStepScreenProps {
  stepId: StepId;
  moduleId: ModuleId;
  phase: Phase;
  copy: ScreenCopy;
}

type CodeState = 'idle' | 'error' | 'success';

/** Подпись под клеткой по фазе синтеза — единственное текстовое сопровождение состояния. */
const TILE_LABEL: Record<ElementState, string> = {
  locked: 'ЖДЁТ ФОРМУЛЫ',
  active: 'ИДЁТ СИНТЕЗ…',
  obtained: 'ПОЛУЧЕНО',
};
const TILE_LABEL_CLASS: Record<ElementState, string> = {
  locked: 'text-ink-faint',
  active: 'text-acid',
  obtained: 'text-sky',
};

/**
 * Общий экран ввода кода модулей 1/2 + сцена разблокировки (ARCHITECTURE.md §7 CodeInput,
 * PRODUCT.md §3.3/§3.5, DESIGN.md §6.3). CodeInput сам умеет слоты/shake/каскад/haptics —
 * этот экран сравнивает код, ведёт стор и раскручивает получение клетки элемента:
 * 'locked' → 'active' (верный код, идёт замер) → 'obtained' (--sky, вещество получено).
 * Переход собран из фаз, а не одной анимацией — клетка сама пульсирует при смене состояния
 * (ElementTile), плюс отдельно проявляется outcome-текст с задержкой после неё.
 */
export function CodeStepScreen({ stepId, moduleId, phase, copy }: CodeStepScreenProps) {
  const next = useFunnelStore((s) => s.next);
  const unlockCode = useFunnelStore((s) => s.unlockCode);
  const reduced = useReducedMotionSafe();
  const module = MODULES[moduleId];
  const codeWord = (copy.codeWord ?? '').toUpperCase().replace(/\s+/g, '');

  const [state, setState] = useState<CodeState>('idle');
  const [unlocked, setUnlocked] = useState(false);
  const settledRef = useRef(false);

  // Пауза перед раскрытием outcome — даём каскаду слотов и скан-линии доиграть (DESIGN.md §7/§8).
  useEffect(() => {
    if (state !== 'success') return;
    const timer = window.setTimeout(
      () => setUnlocked(true),
      reduced ? 0 : durations.scanLine * 1000
    );
    return () => window.clearTimeout(timer);
  }, [state, reduced]);

  const handleSubmit = (value: string): boolean => {
    const ok = value === codeWord;
    track('code_submit', { module: moduleId });
    if (ok) {
      if (!settledRef.current) {
        settledRef.current = true;
        unlockCode(moduleId);
        track('code_success', { module: moduleId });
      }
      setState('success');
    } else {
      track('code_fail', { module: moduleId });
      setState('error');
    }
    return ok;
  };

  const handleNext = () => {
    haptics.medium();
    next();
  };

  // Клетка: заперта, пока код не введён верно; во время замера — активна (--acid);
  // получена — только после того, как каскад слотов и скан-линия доиграли (--sky).
  const tileState: ElementState = unlocked ? 'obtained' : state === 'success' ? 'active' : 'locked';

  return (
    <Screen id={stepId} phase={phase}>
      <h1 className="t-display-l text-ink">{copy.title}</h1>
      <Prose>
        {copy.body?.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </Prose>

      <div className="relative">
        <CodeInput length={codeWord.length} onSubmit={handleSubmit} />
        <ScanLine trigger={state === 'success'} />
      </div>

      {copy.caption && <p className="t-body-s text-center text-ink-faint">{copy.caption}</p>}

      <AnimatePresence>
        {state === 'error' && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.22, ease: easeOut }}
            className="grid gap-1"
          >
            <p className="t-h2 text-bad">{copy.errorTitle}</p>
            <Prose>
              {copy.errorBody?.map((paragraph, i) => (
                <p key={i} className="text-ink-muted">
                  {paragraph}
                </p>
              ))}
            </Prose>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Сцена получения вещества (DESIGN.md §6.1/§6.3): клетка модуля проходит фазами
          заперта → идёт синтез → получена, и только тогда открывается outcome и кнопка «Дальше». */}
      <div className="grid justify-items-center gap-3 py-2">
        <ElementTile
          number={module.number}
          symbol={module.symbol}
          name={module.title}
          mass={moduleMass(module.id)}
          state={tileState}
          size="lg"
        />
        <span className={`t-label ${TILE_LABEL_CLASS[tileState]}`}>{TILE_LABEL[tileState]}</span>

        {/* Пока клетка «активна» (идёт замер) — держим successTitle из копирайта; как только
            клетка «получена» — сменяем на outcome модуля. Два разных бита, а не один текст. */}
        <AnimatePresence mode="wait">
          {tileState === 'active' && copy.successTitle && (
            <motion.p
              key="success-title"
              className="t-body text-ink text-center"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.24, ease: easeOut }}
            >
              {copy.successTitle}
            </motion.p>
          )}
          {tileState === 'obtained' && (
            <motion.p
              key="outcome"
              className="t-body text-ink text-center"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut, delay: reduced ? 0 : 0.1 }}
            >
              {module.outcome}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <BottomBar>
        <Button variant="primary" full disabled={!unlocked} onClick={handleNext}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
