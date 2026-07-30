import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface ChipProps {
  active?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Тег (DESIGN.md v3 §6 Тег): заливка --mint, текст --ink, --r-pill, моно caption.
 * Подписной акцент системы — единственное место, где хроматика вообще появляется.
 * Спокойный вариант (active=false) уходит на --mist, чтобы мята оставалась отметкой,
 * а не фоном (§2.4: хроматических заливок больших поверхностей нет).
 */
export function Chip({ active = true, children, className }: ChipProps) {
  return (
    <span
      className={cn(
        't-caption inline-flex items-center rounded-pill px-[14px] py-1.5',
        active ? 'bg-mint text-ink' : 'bg-mist text-ink-secondary',
        className
      )}
    >
      {children}
    </span>
  );
}
