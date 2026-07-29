import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { durations, easeOut, useReducedMotionSafe } from '../lib/motion';

interface ScanLineProps {
  trigger: boolean;
}

/** Скан-линия панели: единожды, 700ms, не зациклена (DESIGN.md §6.6). Родитель должен быть position:relative. */
export function ScanLine({ trigger }: ScanLineProps) {
  const reduced = useReducedMotionSafe();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger || reduced) return;
    setActive(true);
    const timer = setTimeout(() => setActive(false), durations.scanLine * 1000);
    return () => clearTimeout(timer);
  }, [trigger, reduced]);

  if (reduced) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-10 h-px bg-signal"
          initial={{ top: '0%', opacity: 1 }}
          animate={{ top: '100%', opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durations.scanLine, ease: easeOut }}
        />
      )}
    </AnimatePresence>
  );
}
