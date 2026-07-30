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
 * Крупное число (DESIGN.md v3 §4): дисплейный Oswald с табличными цифрами — типографика
 * здесь и делает всю работу. Мелкий размер идёт моно-шрифтом: сжатый дисплей ниже 28px
 * не применяется (§2.7).
 * Анимация числа — через useMotionValue + animate(), текст пишется прямо в DOM,
 * без ререндера на кадр.
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

  const isLg = size === 'lg';

  return (
    <span
      className="tnum inline-flex items-baseline gap-1 text-ink"
      style={
        isLg
          ? {
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(34px, 10.5vw, 56px)',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
            }
          : {
              fontFamily: 'var(--font-mono)',
              fontWeight: 400,
              fontSize: 14,
              lineHeight: 1.35,
              letterSpacing: '-0.011em',
            }
      }
    >
      <span ref={textRef} className="tnum">
        {formatThousands(value)}
      </span>
      {suffix && (
        // Мелкий размер не уводит суффикс ниже 12px (§2.14)
        <span className="text-ink-muted" style={{ fontSize: isLg ? '0.55em' : 12 }}>
          {suffix}
        </span>
      )}
    </span>
  );
}
