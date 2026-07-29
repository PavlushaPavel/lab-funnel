import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface ChipProps {
  active?: boolean;
  children: ReactNode;
  className?: string;
}

/** Чип-метка (не интерактивна). Активный — заливка --acid-dim. */
export function Chip({ active, children, className }: ChipProps) {
  return (
    <span
      className={cn(
        't-label inline-flex items-center rounded-sm border px-3 py-1 normal-case',
        active ? 'border-line-acid bg-acid-dim text-acid' : 'border-line text-ink-muted',
        className
      )}
    >
      {children}
    </span>
  );
}
