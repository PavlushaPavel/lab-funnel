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

/**
 * Кнопка (DESIGN.md v3 §3, §6).
 * primary  — заливка --inverted, текст --ink-inverted: самый контрастный элемент экрана, одна на экран.
 * secondary — прозрачная, рамка 1.5px --ink-secondary, текст --ink-secondary.
 * ghost    — третичная текстовая ссылка: --ink с подчёркиванием.
 * Нажатие — только opacity 0.85 (§6): мир плоский, «вдавливаний» и смены заливки нет.
 */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-inverted text-ink-inverted',
  secondary: 'bg-transparent text-ink-secondary',
  ghost: 'bg-transparent text-ink underline underline-offset-4',
};

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
        'inline-grid grid-flow-col items-center justify-center gap-2 rounded-button px-5',
        // 52px — кегль первичного действия (§6); sm держит минимальный тап-таргет 44px (§8)
        size === 'md' ? 'h-[52px] text-base' : 'h-11 text-sm',
        full && 'w-full',
        // Disabled — заливка --hairline, текст --ink-muted (§6)
        isDisabled ? 'bg-hairline text-ink-muted' : VARIANT_CLASS[variant],
        className
      )}
      style={{
        // Onest 500 16px (§6 Кнопка первичная)
        fontWeight: 500,
        letterSpacing: '-0.01em',
        border:
          !isDisabled && variant === 'secondary' ? '1.5px solid var(--ink-secondary)' : undefined,
      }}
      whileTap={isDisabled || reduced ? undefined : { opacity: 0.85 }}
      transition={{ duration: durations.press }}
    >
      {icon && <span className="inline-flex h-5 w-5 items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
}
