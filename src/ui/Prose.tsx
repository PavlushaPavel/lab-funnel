import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Типографика длинного текста: рубленые абзацы, ритм sp-3 (DESIGN.md §4). */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('t-body grid gap-3 text-ink', className)}>{children}</div>;
}
