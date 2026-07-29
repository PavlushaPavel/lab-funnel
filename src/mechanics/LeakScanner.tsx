import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaretRight } from '@phosphor-icons/react';
import type { Spec } from '../store/funnel';
import type { LeakScannerData, LeakSegmentId } from '../content/mechanics';
import { cn } from '../lib/cn';
import { haptics } from '../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../lib/motion';
import { mechanicsDurations } from './localMotion';

interface LeakScannerProps {
  data: LeakScannerData;
  spec: Spec;
  onComplete: (result?: unknown) => void;
}

/** Штриховка "тёмного" (неконтролируемого) сегмента — только var()-токены, без хардкода цвета. */
const HATCH_STYLE: CSSProperties = {
  backgroundImage: 'repeating-linear-gradient(45deg, var(--ink-faint) 0 1px, transparent 1px 7px)',
  opacity: 0.5,
};

/**
 * «Где ты слепой» (PRODUCT.md §4.3). Скан-линия проходит по 4 сегментам воронки слева направо,
 * каждый сегмент "загорается" (контролируемый) или остаётся тёмным со штриховкой. Одноразовая
 * анимация на монтаже; onComplete по её завершении.
 */
export function LeakScanner({ data, onComplete }: LeakScannerProps) {
  const { segments, controlledIds } = data;
  const reduced = useReducedMotionSafe();
  const [phase, setPhase] = useState<'scanning' | 'done'>(reduced ? 'done' : 'scanning');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const completedRef = useRef(false);
  const controlledSet = new Set<LeakSegmentId>(controlledIds);

  useEffect(() => {
    if (completedRef.current) return;
    if (reduced) {
      completedRef.current = true;
      onComplete({ controlled: controlledIds.length });
      return;
    }
    const totalMs = mechanicsDurations.leakScanTotal * 1000 + mechanicsDurations.leakResultDelay * 1000;
    const timer = window.setTimeout(() => {
      setPhase('done');
      if (!completedRef.current) {
        completedRef.current = true;
        haptics.success();
        onComplete({ controlled: controlledIds.length });
      }
    }, totalMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- запускаем ровно один раз на монтаже
  }, []);

  const toggle = (id: string) => {
    if (phase !== 'done') return;
    haptics.light();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="grid gap-4">
      <div
        className="relative grid items-stretch gap-1 overflow-hidden"
        style={{ gridTemplateColumns: segments.map((_, i) => (i < segments.length - 1 ? '1fr auto' : '1fr')).join(' ') }}
      >
        {!reduced && phase === 'scanning' && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 z-10 w-px bg-signal"
            style={{ boxShadow: '0 0 8px var(--signal-glow)' }}
            initial={{ left: '0%', opacity: 1 }}
            animate={{ left: '100%', opacity: [1, 1, 0] }}
            transition={{ duration: mechanicsDurations.leakScanTotal, ease: easeOut, times: [0, 0.85, 1] }}
          />
        )}

        {segments.map((segment, i) => {
          const isControlled = controlledSet.has(segment.id);
          const delay = reduced ? 0 : (i / segments.length) * mechanicsDurations.leakScanTotal;
          const isLast = i === segments.length - 1;
          return (
            <div key={segment.id} className="contents">
              <button
                type="button"
                onClick={() => toggle(segment.id)}
                disabled={phase !== 'done'}
                className="grid gap-2 rounded-md border border-line bg-panel p-3 text-left"
                aria-expanded={Boolean(expanded[segment.id])}
              >
                <motion.div
                  className="h-12 rounded-sm"
                  initial={reduced ? false : { opacity: 0.3 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut, delay }}
                  style={
                    isControlled
                      ? { background: 'var(--signal-dim)', border: '1px solid var(--line-signal)' }
                      : { background: 'var(--bg-sunken)', border: '1px solid var(--line)', ...HATCH_STYLE }
                  }
                />
                <span className={cn('t-label', isControlled ? 'text-signal' : 'text-ink-faint')}>
                  {segment.label}
                </span>
              </button>
              {!isLast && (
                <CaretRight
                  aria-hidden="true"
                  weight="regular"
                  size={14}
                  color="var(--ink-faint)"
                  className="self-center"
                />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {Object.keys(expanded)
          .filter((id) => expanded[id])
          .map((id) => {
            const segment = segments.find((s) => s.id === id);
            if (!segment) return null;
            return (
              <motion.p
                key={id}
                className="t-body-s text-ink-muted"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0.12 : 0.2, ease: easeOut }}
              >
                {segment.description}
              </motion.p>
            );
          })}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'done' && (
          <motion.p
            className="t-body text-ink"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.26, ease: easeOut }}
          >
            Ты видишь{' '}
            <span style={{ color: 'var(--signal)', fontFamily: 'var(--font-mono)' }}>
              {controlledIds.length}
            </span>{' '}
            из {segments.length}. Клиент оценивает все {segments.length}.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
