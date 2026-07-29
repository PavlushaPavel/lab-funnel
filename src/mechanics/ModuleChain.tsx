import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'motion/react';
import type { Variants } from 'motion/react';
import { Atom } from '@phosphor-icons/react';
import type { Spec } from '../store/funnel';
import type { ModuleChainData } from '../content/mechanics';
import { ElementTile } from '../ui/ElementTile';
import { ScanLine } from '../ui/ScanLine';
import { Prose } from '../ui/Prose';
import { MODULES, moduleMass } from '../content/modules';
import { cn } from '../lib/cn';
import { haptics } from '../lib/telegram';
import { springPanel, listStagger, easeOut, useReducedMotionSafe } from '../lib/motion';
import { mechanicsDurations } from './localMotion';

interface ModuleChainProps {
  data: ModuleChainData;
  spec: Spec;
  onComplete: (result?: unknown) => void;
}

type Phase = 'gather' | 'bond' | 'pulse' | 'result';

/** Клетка стартует смещённой по X — крайние тянутся к центру, средняя стоит на месте. */
const TILE_START_X = [-28, 0, 28];

const tileVariants: Variants = {
  hidden: (offsetX: number) => ({ opacity: 0, x: offsetX }),
  show: { opacity: 1, x: 0, transition: springPanel },
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Одна химическая связь между клетками: две тонкие параллельные линии (как двойная связь
 * в структурной формуле), а не просто соединительная черта — усиливает язык «реакции синтеза».
 * Цвет связи — кислота (процесс идёт), не небо: небо зарезервировано под сам факт результата
 * (DESIGN.md §2.9), а связь между уже полученными элементами — это ещё процесс сборки, а не он сам.
 */
function Bond({
  drawn,
  lit,
  delay,
  reduced,
}: {
  drawn: boolean;
  lit: boolean;
  delay: number;
  reduced: boolean;
}) {
  return (
    <div className="flex h-6 w-full flex-col items-stretch justify-center gap-[3px]" aria-hidden="true">
      {[0, 1].map((row) => (
        <motion.span
          key={row}
          className="h-px w-full origin-left"
          initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
          animate={{ scaleX: drawn ? 1 : 0 }}
          transition={{
            duration: reduced ? 0.12 : mechanicsDurations.chainConnectorDraw,
            ease: easeOut,
            delay: reduced ? 0 : delay,
          }}
          style={{
            background: lit ? 'var(--acid)' : 'var(--line-acid)',
            boxShadow: lit ? '0 0 6px var(--acid-dim)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Синтез (`ModuleChain`) — кульминация всего приложения (DESIGN.md §6.2, PRODUCT.md §3.4).
 * Три уже полученные клетки элементов сходятся, между ними прорисовываются связи, по связям
 * проходит импульс, и на выходе появляется соединение, подсвеченное --sky. Собрано фазами
 * (gather → bond → pulse → result), а не одной анимацией — смысл в том, что страница не
 * магия, а вещество, синтезированное из результатов предыдущих модулей.
 */
export function ModuleChain({ data, onComplete }: ModuleChainProps) {
  const reduced = useReducedMotionSafe();
  const [phase, setPhase] = useState<Phase>('gather');
  const [lit, setLit] = useState<[boolean, boolean]>([false, false]);
  const [tileHits, setTileHits] = useState<[number, number, number]>([0, 0, 0]);
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
      // Фаза 1: клетки сходятся к центру (см. tileVariants + listStagger).
      await wait(mechanicsDurations.chainSlide * 1000);
      if (cancelled) return;

      // Фаза 2: между ними прорисовываются связи.
      setPhase('bond');
      await wait((mechanicsDurations.chainConnectorDraw * 2 + mechanicsDurations.chainConnectorGap) * 1000);
      if (cancelled) return;

      // Фаза 3: импульс идёт по связям слева направо, они загораются по пути.
      setPhase('pulse');
      setTileHits(([a, b, c]) => [a + 1, b, c]);
      await animate(progress, 0.5, { duration: mechanicsDurations.chainSignalTravel / 2, ease: easeOut });
      if (cancelled) return;
      setLit([true, false]);
      setTileHits(([a, b, c]) => [a, b + 1, c]);
      haptics.light();
      await animate(progress, 1, { duration: mechanicsDurations.chainSignalTravel / 2, ease: easeOut });
      if (cancelled) return;
      setLit([true, true]);
      setTileHits(([a, b, c]) => [a, b, c + 1]);

      // Фаза 4: реакция завершена — на выходе соединение, подсвеченное --sky.
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

  const settled = phase === 'result';
  // Формула соединения на выходе реакции — символы трёх полученных элементов (DESIGN.md §6.3).
  const formula = data.modules.map((m) => MODULES[m.id].symbol).join(' + ');

  return (
    <div className="grid gap-6">
      <motion.div
        className={cn(
          'relative grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 rounded-lg border p-3 transition-colors',
          settled ? 'border-sky bg-sky-dim' : 'border-line bg-panel'
        )}
        style={{ transitionDuration: reduced ? '120ms' : '340ms' }}
        variants={reduced ? undefined : listStagger}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'show'}
      >
        {data.modules.map((module, i) => {
          const isLast = i === data.modules.length - 1;
          return (
            <div key={module.id} className="contents">
              <motion.div
                custom={TILE_START_X[i]}
                variants={reduced ? undefined : tileVariants}
                className="justify-self-center"
              >
                <ElementTile
                  key={`${module.id}-${tileHits[i]}`}
                  number={MODULES[module.id].number}
                  symbol={MODULES[module.id].symbol}
                  name={MODULES[module.id].title}
                  mass={moduleMass(module.id)}
                  state="obtained"
                  size="md"
                />
              </motion.div>
              {!isLast && (
                <Bond
                  drawn={phase !== 'gather'}
                  lit={lit[i]}
                  delay={i * (mechanicsDurations.chainConnectorDraw + mechanicsDurations.chainConnectorGap)}
                  reduced={reduced}
                />
              )}
            </div>
          );
        })}

        <AnimatePresence>
          {!reduced && phase === 'pulse' && (
            <motion.div
              key="pulse"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full bg-acid"
              style={{ left: pulseLeft, opacity: pulseOpacity, boxShadow: '0 0 8px var(--acid-dim)' }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Соединение на выходе реакции — единственный легальный смысл --sky: результат получен. */}
      <AnimatePresence>
        {settled && (
          <motion.div
            className="relative grid gap-2 rounded-lg border p-4"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduced ? 0.12 : 0.34, ease: easeOut }}
            style={{ borderColor: 'var(--sky)', background: 'var(--sky-dim)', boxShadow: 'var(--shadow-panel-sheen)' }}
          >
            <div className="flex items-center gap-2">
              <Atom weight="regular" size={16} className="text-sky" aria-hidden="true" />
              <span className="t-label text-sky">СОЕДИНЕНИЕ</span>
            </div>
            <p className="t-readout-s tnum text-sky" style={{ fontSize: 17 }}>
              {formula}
            </p>
            <Prose>
              <p className="t-h2 text-ink">{data.resultLine}</p>
            </Prose>
            <ScanLine trigger={settled} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
