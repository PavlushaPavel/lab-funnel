import { useEffect, useRef, useState } from 'react';
import { Lock, LockOpen } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { NodeLabel } from '../../ui/NodeLabel';
import { Panel } from '../../ui/Panel';
import { Prose } from '../../ui/Prose';
import { CodeInput } from '../../ui/CodeInput';
import { ScanLine } from '../../ui/ScanLine';
import { MODULES } from '../../content/modules';
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

/**
 * Общий экран ввода кода модулей 1/2 + явная сцена разблокировки узла (ARCHITECTURE.md §7
 * CodeInput, PRODUCT.md §3.3/§3.5). CodeInput сам умеет слоты/shake/каскад/haptics —
 * этот экран только сравнивает код, ведёт стор и раскручивает сцену «заперто → активно».
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

  return (
    <Screen id={stepId} phase={phase}>
      <NodeLabel code={module.code} title={module.title} status={unlocked ? 'active' : 'locked'} />

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

      {/* Явная сцена разблокировки узла (PRODUCT.md §3.3): карточка «заперто → активно»,
          статус-точка загорается сигналом, показывается outcome модуля — и только тогда
          доступна кнопка «Дальше». */}
      <AnimatePresence>
        {state === 'success' && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut }}
          >
            <Panel label={`${module.code} · ${module.title}`} status={unlocked ? 'active' : 'scanning'}>
              <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                {unlocked ? (
                  <LockOpen weight="regular" size={22} color="var(--signal)" aria-hidden="true" />
                ) : (
                  <Lock weight="regular" size={22} color="var(--ink-faint)" aria-hidden="true" />
                )}
                <div className="grid gap-1">
                  <span
                    className="t-label"
                    style={{ color: unlocked ? 'var(--signal)' : 'var(--ink-faint)' }}
                  >
                    {unlocked ? 'УЗЕЛ АКТИВЕН' : 'РАЗБЛОКИРОВКА…'}
                  </span>
                  {!unlocked && <p className="t-body text-ink">{copy.successTitle}</p>}
                  <AnimatePresence>
                    {unlocked && (
                      <motion.p
                        className="t-body text-ink"
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduced ? 0.12 : 0.28, ease: easeOut }}
                      >
                        {module.outcome}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomBar>
        <Button variant="primary" full disabled={!unlocked} onClick={handleNext}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
