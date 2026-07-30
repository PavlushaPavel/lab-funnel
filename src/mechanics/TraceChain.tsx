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

/** Связь между ступенями: волосяная линия --hairline со стрелкой Phosphor (DESIGN.md §3, §2.9). */
function ChainLink() {
  return (
    <div className="grid justify-items-center gap-1 py-1" aria-hidden="true">
      <span className="h-3 w-px" style={{ background: 'var(--hairline)' }} />
      <ArrowDown weight="regular" size={14} color="var(--ink-muted)" />
    </div>
  );
}

/**
 * Сквозная трассировка одной ситуации через всю работу (PRODUCT.md §4, замена снесённой
 * анимации «синтеза» ModuleChain). Четыре ступени — СИТУАЦИЯ → ЗАПРОС → ОБЪЯВЛЕНИЕ →
 * ПЕРВЫЙ ЭКРАН — раскрываются одна за другой без единого пояснительного слова: смысл в том,
 * что это одна и та же ситуация на каждой ступени, а не в тексте вокруг карточек.
 * Чистый показ, без выбора и ввода — onComplete срабатывает сам, как только раскрыта
 * последняя ступень (или сразу же, если prefers-reduced-motion — тогда всё видно одним
 * экраном). Данные не ходят в стор и шаг не переключают (ARCHITECTURE.md §9).
 *
 * Мир v3 (DESIGN.md §6): ступени — белые карточки, и ровно одна из них инверсная — последняя,
 * «ПЕРВЫЙ ЭКРАН». Это профессиональная кульминация модуля, точка прибытия цепочки, поэтому
 * приём «разрыва светлого ритма» тратится здесь один раз и больше в механиках не встречается.
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
    <div className="grid">
      {data.stages.slice(0, revealed).map((stage, i) => {
        const isArrival = i === data.stages.length - 1;
        return (
          <div key={stage.role} className="grid">
            {i > 0 && <ChainLink />}
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.32, ease: easeOut }}
              className={
                isArrival
                  ? 'grid gap-2 rounded-card-lg bg-inverted p-(--card-pad)'
                  : 'grid gap-2 rounded-card bg-card p-(--card-pad)'
              }
            >
              <span className="t-caption" style={isArrival ? { color: 'var(--hairline)' } : undefined}>
                {stage.role}
              </span>
              {isArrival ? (
                <p className="t-subheading text-ink-inverted">«{stage.text}»</p>
              ) : (
                <p className="t-body text-ink">«{stage.text}»</p>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
