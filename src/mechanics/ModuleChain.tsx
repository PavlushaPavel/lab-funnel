import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'motion/react';
import type { Variants } from 'motion/react';
import type { Spec } from '../store/funnel';
import type { ModuleChainData } from '../content/mechanics';
import { NodeLabel } from '../ui/NodeLabel';
import { ScanLine } from '../ui/ScanLine';
import { Prose } from '../ui/Prose';
import { cn } from '../lib/cn';
import { haptics } from '../lib/telegram';
import { springPanel, listStagger, easeOut, useReducedMotionSafe } from '../lib/motion';
import { mechanicsDurations } from './localMotion';

interface ModuleChainProps {
  data: ModuleChainData;
  spec: Spec;
  onComplete: (result?: unknown) => void;
}

type Phase = 'slide' | 'connect' | 'signal' | 'result';

/** Карточка стартует смещённой по X — крайние тянутся к центру, средняя стоит на месте. */
const CARD_START_X = [-28, 0, 28];

const cardVariants: Variants = {
  hidden: (offsetX: number) => ({ opacity: 0, x: offsetX }),
  show: { opacity: 1, x: 0, transition: springPanel },
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Сборка цепочки — кульминация всего приложения (PRODUCT.md §3.4). Три карточки модулей
 * съезжаются, между ними прорисовываются коннекторы, по цепочке проходит сигнал слева направо,
 * в конце подсвечивается итоговый блок «СТРАНИЦА». Оркестровано фазами, не одной анимацией.
 */
export function ModuleChain({ data, onComplete }: ModuleChainProps) {
  const reduced = useReducedMotionSafe();
  const [phase, setPhase] = useState<Phase>('slide');
  const [lit, setLit] = useState<[boolean, boolean]>([false, false]);
  const progress = useMotionValue(0);
  const pulseLeft = useTransform(progress, (p) => `${p * 100}%`);
  const pulseOpacity = useTransform(progress, (p) => (p <= 0 ? 0 : 1));
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    if (reduced) {
      setPhase('result');
      setLit([true, true]);
      onComplete({ chained: true });
      return;
    }

    let cancelled = false;

    async function run() {
      // Фаза 1: карточки съезжаются в ряд (см. cardVariants + listStagger).
      await wait(mechanicsDurations.chainSlide * 1000);
      if (cancelled) return;

      // Фаза 2: коннекторы прорисовываются между карточками.
      setPhase('connect');
      await wait((mechanicsDurations.chainConnectorDraw * 2 + mechanicsDurations.chainConnectorGap) * 1000);
      if (cancelled) return;

      // Фаза 3: сигнал идёт по цепочке слева направо, коннекторы загораются по пути.
      setPhase('signal');
      await animate(progress, 0.5, { duration: mechanicsDurations.chainSignalTravel / 2, ease: easeOut });
      if (cancelled) return;
      setLit([true, false]);
      haptics.light();
      await animate(progress, 1, { duration: mechanicsDurations.chainSignalTravel / 2, ease: easeOut });
      if (cancelled) return;
      setLit([true, true]);

      // Фаза 4: итоговый блок «СТРАНИЦА» подсвечивается.
      setPhase('result');
      haptics.success();
      await wait(mechanicsDurations.chainResultHold * 1000);
      if (cancelled) return;
      onComplete({ chained: true });
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- сценарий запускается ровно один раз
  }, []);

  return (
    <div className="grid gap-6">
      <motion.div
        className="relative grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-0"
        variants={reduced ? undefined : listStagger}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'show'}
      >
        {data.modules.map((module, i) => {
          const isFinal = i === data.modules.length - 1;
          const highlighted = isFinal && phase === 'result';
          return (
            <div key={module.id} className="contents">
              <motion.div
                custom={CARD_START_X[i]}
                variants={reduced ? undefined : cardVariants}
                className="relative grid gap-2 rounded-lg border p-3"
                style={{
                  borderColor: highlighted ? 'var(--line-signal)' : 'var(--line)',
                  background: highlighted ? 'var(--signal-dim)' : 'var(--bg-panel)',
                  boxShadow: 'var(--shadow-panel-sheen)',
                }}
              >
                <NodeLabel code={module.code} title={module.title} status="done" />
                <p className="t-body-s text-ink-muted">{module.output}</p>
                <ScanLine trigger={highlighted} />
              </motion.div>
              {!isFinal && (
                <motion.div
                  aria-hidden="true"
                  className="h-0.5 w-full origin-left"
                  initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                  animate={{ scaleX: phase === 'slide' ? 0 : 1 }}
                  transition={{
                    duration: reduced ? 0.12 : mechanicsDurations.chainConnectorDraw,
                    ease: easeOut,
                    delay: reduced ? 0 : i * (mechanicsDurations.chainConnectorDraw + mechanicsDurations.chainConnectorGap),
                  }}
                  style={{
                    background: lit[i] ? 'var(--signal)' : 'var(--line-strong)',
                    boxShadow: lit[i] ? '0 0 6px var(--signal-glow)' : undefined,
                  }}
                />
              )}
            </div>
          );
        })}

        <AnimatePresence>
          {!reduced && phase === 'signal' && (
            <motion.div
              key="pulse"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full bg-signal"
              style={{ left: pulseLeft, opacity: pulseOpacity, boxShadow: '0 0 8px var(--signal-glow)' }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {phase === 'result' && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut }}
          >
            <Prose>
              <p className={cn('t-h2', 'text-ink')}>{data.resultLine}</p>
            </Prose>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
