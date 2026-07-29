import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface WellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Колодец показаний: утопленная область для крупных моно-чисел и слотов кода (DESIGN.md §6.4).
 * Сам колодец нейтрален — цвет счётчика утечки (--rust) задаёт вызывающий экран через Readout;
 * показания утечки используют --rust напрямую.
 */
export function Well({ children, className }: WellProps) {
  return (
    <div
      className={cn('rounded-lg border-t border-line bg-sunken px-4 py-5', className)}
      style={{ boxShadow: 'var(--shadow-well-inset)' }}
    >
      {children}
    </div>
  );
}
