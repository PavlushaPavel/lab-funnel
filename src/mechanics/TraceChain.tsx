import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from '@phosphor-icons/react';
import type { Spec } from '../store/funnel';
import type { TraceChainData } from '../content/mechanics';
import { easeOut, useReducedMotionSafe } from '../lib/motion';
import { mechanicsDurations } from './localMotion';

interface TraceChainProps {
  data: TraceChainData;
  spec: Spec;
  onComplete: (result?: unknown) => void;
}

/**
 * Сквозная трассировка одной ситуации через всю работу (PRODUCT.md §4, замена снесённой
 * анимации «синтеза» ModuleChain). Четыре ступени — СИТУАЦИЯ → ЗАПРОС → ОБЪЯВЛЕНИЕ →
 * ПЕРВЫЙ ЭКРАН — раскрываются одна за другой без единого пояснительного слова: смысл в том,
 * что это одна и та же ситуация на каждой ступени, а не в тексте вокруг карточек.
 * Чистый показ, без выбора и ввода — onComplete срабатывает сам, как только раскрыта
 * последняя ступень (или сразу же, если prefers-reduced-motion — тогда всё видно одним
 * экраном). Данные не ходят в стор и шаг не переключают (ARCHITECTURE.md §9).
 */
export function TraceChain({ data, onComplete }: TraceChainProps) {
  const reduced = useReducedMotionSafe();
  const completedRef = useRef(false);
  const [revealed, setRevealed] = useState(() => (reduced ? data.stages.length : 0));

  // Смена ниши (другой spec) — начинаем раскрытие заново, а не достраиваем поверх старого.
  useEffect(() => {
    completedRef.current = false;
    setRevealed(reduced ? data.stages.length : 0);
  }, [data, reduced]);

  useEffect(() => {
    if (revealed < data.stages.length) {
      if (reduced) return; // reduced-motion уже показал всё разом при инициализации
      const timer = window.setTimeout(
        () => setRevealed((r) => Math.min(r + 1, data.stages.length)),
        mechanicsDurations.traceChainStep * 1000
      );
      return () => window.clearTimeout(timer);
    }
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete({ stages: data.stages.length });
    }
  }, [revealed, reduced, data, onComplete]);

  return (
    <div className="grid gap-1">
      {data.stages.slice(0, revealed).map((stage, i) => (
        <div key={stage.role} className="grid gap-1">
          {i > 0 && (
            <div className="flex justify-center py-0.5" aria-hidden="true">
              <ArrowDown weight="regular" size={16} className="text-ink-faint" />
            </div>
          )}
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.32, ease: easeOut }}
            className="grid gap-1.5 rounded-lg border border-line bg-panel p-4"
            style={{ boxShadow: 'var(--shadow-panel-sheen)' }}
          >
            <span className="t-label text-ink-faint">{stage.role}</span>
            <p className="t-body text-ink">«{stage.text}»</p>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
