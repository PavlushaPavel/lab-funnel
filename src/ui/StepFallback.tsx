import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TickRail } from './TickRail';
import { easeOut, useReducedMotionSafe } from '../lib/motion';

/**
 * Локальный тайминг показа фолбэка — не пружина/базовая длительность (lib/motion.ts),
 * а порог «чанк реально не успел». Пока чанк грузится быстрее этого порога (обычный
 * случай — App.tsx префетчит следующий шаг заранее), пользователь фолбэк не видит.
 */
const FALLBACK_SHOW_DELAY_S = 0.18;

/**
 * Suspense-фолбэк между экранами (DESIGN.md v3 §4, §7). Каркас тот же, что у Screen
 * (min-h-[100dvh], --app-max, --gutter), поэтому раскладка не прыгает при замене на экран.
 * Язык — моно-лейбл и плоская линия прогресса, ничего приборного.
 */
export function StepFallback() {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), FALLBACK_SHOW_DELAY_S * 1000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto grid min-h-[100dvh] max-w-(--app-max) auto-rows-min content-center gap-(--sp-2) bg-canvas px-(--gutter)">
      {visible && (
        <motion.div
          className="grid max-w-[40ch] gap-(--sp-2)"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0.12 } : { duration: 0.26, ease: easeOut }}
        >
          <span className="t-caption">ЗАГРУЗКА</span>
          <TickRail progress={0.4} />
        </motion.div>
      )}
    </div>
  );
}
