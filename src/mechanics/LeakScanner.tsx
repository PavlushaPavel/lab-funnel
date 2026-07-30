import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaretDown, Check, Question } from '@phosphor-icons/react';
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

/**
 * «Где ты слепой» (PRODUCT.md §4.3). Четыре сегмента воронки проявляются один за другим
 * по порядку; контролируемые читаются как «сделано», неконтролируемые — как зона
 * неизвестности. Одноразовое появление на монтаже; onComplete по его завершении.
 *
 * Мир v3 (DESIGN.md §3): скан-линии из тёмного мира больше нет — светлый редакционный мир
 * не «сканирует». Неконтролируемый сегмент не гасится прозрачностью и не размечается
 * хазмат-штриховкой: он получает тихую подложку --mist, рамку --hairline и подпись
 * --ink-secondary, то есть читается как «не знаю, что там», а не как выключенная кнопка.
 * Воронка развёрнута сверху вниз: моно-подписи сегментов набираются в полную ширину,
 * а не ломаются посреди слова в четырёх узких колонках.
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
    <div className="grid gap-(--sp-3)">
      <div className="grid gap-1">
        {segments.map((segment, i) => {
          const isControlled = controlledSet.has(segment.id);
          const delay = reduced ? 0 : (i / segments.length) * mechanicsDurations.leakScanTotal;
          const isOpen = Boolean(expanded[segment.id]);
          return (
            <motion.div
              key={segment.id}
              className="grid gap-1"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut, delay }}
            >
              {i > 0 && (
                <div className="grid justify-items-center py-0.5" aria-hidden="true">
                  <CaretDown weight="regular" size={12} color="var(--ink-muted)" />
                </div>
              )}
              <button
                type="button"
                onClick={() => toggle(segment.id)}
                disabled={phase !== 'done'}
                aria-expanded={isOpen}
                className={cn(
                  'grid min-h-11 w-full grid-cols-[20px_1fr] items-center gap-3 rounded-card px-4 py-3 text-left',
                  isControlled ? 'bg-mint' : 'bg-mist'
                )}
                style={isControlled ? undefined : { border: '1px solid var(--hairline)' }}
              >
                <span aria-hidden="true">
                  {isControlled ? (
                    <Check weight="regular" size={18} color="var(--ink)" />
                  ) : (
                    <Question weight="regular" size={18} color="var(--ink-secondary)" />
                  )}
                </span>
                <span className={cn('t-caption', isControlled ? 'text-ink' : 'text-ink-secondary')}>
                  {segment.label}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.p
                    className="t-body-sm px-1 text-ink-secondary"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0.12 : 0.2, ease: easeOut }}
                  >
                    {segment.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {phase === 'done' && (
          <motion.p
            className="t-body text-ink"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.26, ease: easeOut }}
          >
            Ты видишь{' '}
            <span className="tnum" style={{ fontFamily: 'var(--font-mono)' }}>
              {controlledIds.length}
            </span>{' '}
            из {segments.length}. Клиент оценивает все {segments.length}.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
