import { useFunnelStore } from '../store/funnel';
import { STEPS } from '../router/flow';

/**
 * Верхний прогресс (DESIGN.md v3 §6 ProgressRail): тонкая линия 3px — трек --hairline,
 * пройденная часть --ink, плюс моно-подпись «ШАГ 07 / 25».
 * Фазы воронки (ЗНАЮ/ХОЧУ/ВЕРЮ/ПЛАЧУ) не показываются никогда (§2.12) — это внутренняя механика.
 * Калибровочной шкалы прошлых версий здесь больше нет.
 */
const RAIL_THICKNESS = 3;

export function ProgressRail() {
  const step = useFunnelStore((s) => s.step);
  const total = STEPS.length;
  const index = Math.max(0, STEPS.indexOf(step));
  const position = index + 1;
  const ratio = total > 1 ? index / (total - 1) : 0;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="sticky top-0 z-30 bg-canvas"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        className="w-full bg-hairline"
        style={{ height: RAIL_THICKNESS }}
        role="progressbar"
        aria-valuenow={position}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Прогресс"
      >
        <div className="h-full bg-ink" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mx-auto grid max-w-(--app-max) px-(--gutter) py-2">
        <span className="t-caption tnum">
          ШАГ {pad(position)} / {pad(total)}
        </span>
      </div>
    </div>
  );
}
