import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * Длинный текст (DESIGN.md v3 §4): Onest 16px/1.45, мера ≤40ch (её держит сам .t-body),
 * рубленые короткие абзацы отдельными <p>, вертикальный ритм --sp-3.
 */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('t-body grid gap-(--sp-3) text-ink', className)}>{children}</div>;
}
