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

/** Обёртка экрана: gutters, вход/выход (DESIGN.md §8). Родитель обязан key={id} внутри AnimatePresence. */
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
      className="mx-auto grid min-h-dvh max-w-(--app-max) auto-rows-min gap-6 px-(--gutter) py-6"
    >
      {label && <p className="t-label text-ink-faint">{label}</p>}
      {children}
    </motion.div>
  );
}
