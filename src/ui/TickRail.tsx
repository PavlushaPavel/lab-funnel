import { cn } from '../lib/cn';

interface TickRailProps {
  progress: number; // 0..1
  height?: number;
  className?: string;
}

/**
 * Калибровочная шкала — главный фирменный элемент (DESIGN.md §6.1).
 * Два слоя рисок: полная дорожка цветом --line, поверх — залитая доля --signal,
 * обрезанная по progress через overflow:hidden.
 */
export function TickRail({ progress, height = 24, className }: TickRailProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div
      className={cn('relative w-full', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="tick-rail-fill" style={{ ['--tick-color' as string]: 'var(--line)' }} />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${clamped * 100}%` }}
      >
        {/* inset:0 внутри уже обрезанной обёртки — риски продолжают ту же сетку 6px от общего левого края */}
        <div className="tick-rail-fill" style={{ ['--tick-color' as string]: 'var(--signal)' }} />
      </div>
    </div>
  );
}
