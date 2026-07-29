import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { NodeLabel } from './NodeLabel';
import { TickRail } from './TickRail';
import { easeOut, useReducedMotionSafe } from '../lib/motion';

/**
 * Локальный тайминг показа фолбэка — не пружина/базовая длительность (lib/motion.ts),
 * а порог "чанк реально не успел" (ARCHITECTURE.md §11.3, тот же приём, что BOOT в IntroScreen).
 * Пока чанк грузится быстрее этого порога (обычный случай — App.tsx префетчит следующий шаг
 * в простое заранее), пользователь фолбэк вообще не видит.
 */
const FALLBACK_SHOW_DELAY_S = 0.18;

/**
 * Suspense-фолбэк между экранами воронки (DESIGN.md §3, §6). Каркас — тот же, что у Screen
 * (min-h-dvh, --app-max, --gutter), поэтому раскладка не прыгает при замене на настоящий экран.
 * Появляется с задержкой, а не мгновенно: при удачном префетче (App.tsx) его не видно вовсе.
 * Язык — маркировка узла со статусом «идёт замер» (пульсирующая --rust точка, DESIGN.md §6.2)
 * и калибровочная шкала — те же фирменные элементы, что и на «бутовом» экране intro.
 */
export function StepFallback() {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), FALLBACK_SHOW_DELAY_S * 1000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto grid min-h-dvh max-w-(--app-max) auto-rows-min content-center gap-4 px-(--gutter) py-6">
      {visible && (
        <motion.div
          className="grid gap-3"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0.12 } : { duration: 0.2, ease: easeOut }}
        >
          <NodeLabel code="ЛАБОРАТОРИЯ" title="ИДЁТ ЗАМЕР" status="scanning" />
          <TickRail progress={0.4} height={16} />
        </motion.div>
      )}
    </div>
  );
}
