import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Prose } from '../../ui/Prose';
import { CodeInput } from '../../ui/CodeInput';
import { ScanLine } from '../../ui/ScanLine';
import { ModuleBadge } from '../../ui/ModuleBadge';
import type { ModuleBadgeState } from '../../ui/ModuleBadge';
import { MODULES } from '../../content/modules';
import { isVideoPlaceholder } from '../../content/video';
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

/** Подпись под карточкой модуля по фазе проверки кода — единственное текстовое сопровождение. */
const TILE_LABEL: Record<ModuleBadgeState, string> = {
  locked: 'Ждём слово',
  active: 'Проверяем',
  done: 'Доступ открыт',
};
const TILE_LABEL_CLASS: Record<ModuleBadgeState, string> = {
  locked: 'text-ink-faint',
  active: 'text-acid',
  done: 'text-sky',
};

/**
 * Общий экран ввода кода модулей 1/2 + сцена разблокировки (ARCHITECTURE.md §7 CodeInput,
 * PRODUCT.md §3.3/§3.5). CodeInput сам умеет слоты/shake/каскад/haptics — этот экран
 * сравнивает код, ведёт стор и раскручивает открытие доступа к практике модуля:
 * 'locked' → 'active' (код принят, идёт проверка) → 'done' (--sky, доступ открыт).
 * Верный код открывает ТОЛЬКО доступ к практике (store::unlockCode) — модуль засчитывается
 * пройденным (store::completeModule) позже, экраном практики, только после реальной работы.
 * Переход собран из фаз, а не одной анимацией — карточка модуля сама пульсирует при смене
 * состояния (ModuleBadge), плюс отдельно проявляется outcome-текст с задержкой после неё.
 */
export function CodeStepScreen({ stepId, moduleId, phase, copy }: CodeStepScreenProps) {
  const next = useFunnelStore((s) => s.next);
  const unlockCode = useFunnelStore((s) => s.unlockCode);
  const reduced = useReducedMotionSafe();
  const module = MODULES[moduleId];
  const codeWord = (copy.codeWord ?? '').toUpperCase().replace(/\s+/g, '');
  // Пока ролик не подключён, ключевое слово физически неоткуда узнать — показываем его,
  // иначе воронка непроходима. С появлением реального src подсказка исчезает сама.
  const videoPending = isVideoPlaceholder(`${moduleId}-video`);

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

  // Карточка модуля: заперта, пока код не введён верно; во время проверки — активна (--acid);
  // доступ открыт — только после того, как каскад слотов и скан-линия доиграли (--sky).
  const tileState: ModuleBadgeState = unlocked ? 'done' : state === 'success' ? 'active' : 'locked';

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

      {videoPending && (
        <p className="t-body-s text-ink-muted">
          Видео пока не подключено, взять слово неоткуда — на время сборки оно такое:{' '}
          <span className="t-readout-s text-acid">{codeWord}</span>
        </p>
      )}

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

      {/* Сцена открытия доступа: карточка модуля проходит фазами заперта → проверяем →
          доступ открыт, и только тогда открывается outcome и кнопка «Дальше». */}
      <div className="grid justify-items-center gap-3 py-2">
        <ModuleBadge code={module.code} title={module.title} state={tileState} size="lg" />
        <span className={`t-label ${TILE_LABEL_CLASS[tileState]}`}>{TILE_LABEL[tileState]}</span>

        {/* Пока карточка «активна» (идёт проверка) — держим successTitle из копирайта; как
            только доступ открыт — сменяем на outcome модуля. Два разных бита, а не один текст. */}
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
          {tileState === 'done' && (
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
