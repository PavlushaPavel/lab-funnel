import { cn } from '../lib/cn';
import { durations, useReducedMotionSafe } from '../lib/motion';

interface TickRailProps {
  progress: number; // 0..1
  height?: number;
  className?: string;
}

/**
 * Плоская линия прогресса (DESIGN.md v3 §6): трек --hairline, пройденное --ink, толщина 3px.
 * Калибровочной шкалы с рисками из снятых версий больше нет — она держалась на
 * repeating-linear-gradient, а градиенты в системе запрещены (§2.2).
 * Имя и пропсы сохранены: на TickRail ссылаются экраны воронки. `height` задаёт высоту
 * посадочного места (линия центрируется внутри), сама линия всегда 3px.
 */
const RAIL_THICKNESS = 3;

export function TickRail({ progress, height = RAIL_THICKNESS, className }: TickRailProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const reduced = useReducedMotionSafe();

  return (
    <div
      className={cn('grid w-full items-center', className)}
      style={{ height: Math.max(height, RAIL_THICKNESS) }}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="w-full overflow-hidden bg-hairline"
        style={{ height: RAIL_THICKNESS, borderRadius: RAIL_THICKNESS }}
      >
        <div
          className="h-full bg-ink"
          style={{
            width: `${clamped * 100}%`,
            transitionProperty: 'width',
            transitionDuration: reduced ? '0ms' : `${durations.tickDraw * 1000}ms`,
          }}
        />
      </div>
    </div>
  );
}
