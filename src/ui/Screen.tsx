import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { StepId, Phase } from '../store/funnel';
import { screenVariants, useReducedMotionSafe } from '../lib/motion';

interface ScreenProps {
  id: StepId;
  label?: string;
  phase?: Phase;
  children: ReactNode;
}

/**
 * Обёртка экрана (DESIGN.md v3 §5, §7): фон --canvas, боковые поля --gutter 16px,
 * safe-area снизу, вход/выход только opacity + y 8px.
 * Родитель обязан ставить key={id} внутри AnimatePresence.
 */
export function Screen({ id, label, phase, children }: ScreenProps) {
  const reduced = useReducedMotionSafe();

  return (
    <motion.div
      id={id}
      data-phase={phase}
      variants={reduced ? undefined : screenVariants}
      initial={reduced ? { opacity: 0 } : 'enter'}
      animate={reduced ? { opacity: 1 } : 'center'}
      exit={reduced ? { opacity: 0 } : 'exit'}
      transition={reduced ? { duration: 0.12 } : undefined}
      className="mx-auto grid min-h-[100dvh] max-w-(--app-max) auto-rows-min gap-6 bg-canvas px-(--gutter) pt-6"
      style={{ paddingBottom: 'max(var(--sp-3), env(safe-area-inset-bottom))' }}
    >
      {label && <p className="t-caption">{label}</p>}
      {children}
    </motion.div>
  );
}
