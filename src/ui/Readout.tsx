import { useEffect, useRef } from 'react';
import { animate, useMotionValue, useMotionValueEvent } from 'motion/react';
import { formatThousands } from '../lib/format';
import { springSoft, useReducedMotionSafe } from '../lib/motion';

interface ReadoutProps {
  value: number;
  suffix?: string;
  size?: 'lg' | 'sm';
  animate?: boolean;
}

/**
 * Показание-счётчик. Анимация числа через useMotionValue + animate() (DESIGN.md §7 Readout),
 * НЕ через useState на кадр — текст пишется напрямую в DOM через useMotionValueEvent.
 */
export function Readout({ value, suffix, size = 'lg', animate: shouldAnimate = true }: ReadoutProps) {
  const mv = useMotionValue(value);
  const textRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    if (!shouldAnimate || reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, springSoft);
    return () => controls.stop();
  }, [value, shouldAnimate, reduced, mv]);

  useMotionValueEvent(mv, 'change', (latest) => {
    if (textRef.current) textRef.current.textContent = formatThousands(latest);
  });

  return (
    <span className={size === 'lg' ? 't-readout' : 't-readout-s'}>
      <span ref={textRef} className="tnum">
        {formatThousands(value)}
      </span>
      {suffix && (
        <span className="text-ink-muted" style={{ fontSize: '0.55em' }}>
          {suffix}
        </span>
      )}
    </span>
  );
}
