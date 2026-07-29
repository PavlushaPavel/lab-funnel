import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/cn';
import { durations, useReducedMotionSafe } from '../lib/motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'sm';

interface ButtonProps {
  variant: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
  children: ReactNode;
  type?: 'button' | 'submit';
  className?: string;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-acid text-ink-invert',
  secondary: 'bg-transparent text-ink border border-line-strong',
  ghost: 'bg-transparent text-ink',
};

const VARIANT_PRESS_BG: Record<ButtonVariant, string> = {
  primary: 'var(--acid-deep)',
  secondary: 'var(--bg-raised)',
  ghost: 'var(--bg-raised)',
};

const VARIANT_BG: Record<ButtonVariant, string> = {
  primary: 'var(--acid)',
  secondary: 'transparent',
  ghost: 'transparent',
};

/** Первичная/вторичная/ghost-кнопка. Визуал — DESIGN.md §7 Button. */
export function Button({
  variant,
  size = 'md',
  onClick,
  disabled,
  loading,
  icon,
  full,
  children,
  type = 'button',
  className,
}: ButtonProps) {
  const reduced = useReducedMotionSafe();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-grid grid-flow-col items-center justify-center gap-2 rounded-md px-5',
        size === 'md' ? 'h-[54px] text-base' : 'h-11 text-sm',
        full && 'w-full',
        !isDisabled && VARIANT_CLASS[variant],
        isDisabled && 'bg-raised text-ink-faint',
        className
      )}
      style={{
        fontWeight: 600,
        letterSpacing: '-0.01em',
        backgroundColor: isDisabled ? undefined : VARIANT_BG[variant],
      }}
      whileTap={
        isDisabled || reduced
          ? undefined
          : { scale: 0.985, backgroundColor: VARIANT_PRESS_BG[variant] }
      }
      transition={{ duration: durations.press }}
    >
      {icon && <span className="inline-flex h-5 w-5 items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
}
