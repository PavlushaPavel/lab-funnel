import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface WellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Тихая панель на --mist с --r-card (DESIGN.md v3 §3, §6).
 * «Колодца показаний» из снятых версий больше нет: утопленность держалась на внутренней
 * тени, а теней в системе нет (§2.1). Вторичная поверхность отличается от белой карточки
 * только тоном — это и есть вся глубина.
 */
export function Well({ children, className }: WellProps) {
  return <div className={cn('rounded-card bg-mist p-(--card-pad)', className)}>{children}</div>;
}
