import { useFunnelStore, selectProgress } from '../store/funnel';
import { TickRail } from './TickRail';

/**
 * Верхний рельс: сама читает стор (ARCHITECTURE.md §7 ProgressRail).
 * Показывает ТОЛЬКО долю пройденного пути — фазы воронки (ЗНАЮ/ХОЧУ/ВЕРЮ/ПЛАЧУ) пользователю
 * не показываются никогда (DESIGN.md §2.1, PRODUCT.md §2): это внутренняя механика прогрева.
 * Вместо фаз — счётчик пройденных модулей вида «1/3» (по `modules`, не по `codes` — коду
 * доступа модуль пока не засчитан пройденным, ARCHITECTURE.md §3).
 */
export function ProgressRail() {
  const progress = useFunnelStore(selectProgress);
  const obtained = useFunnelStore((s) => Object.values(s.modules).filter(Boolean).length);
  const total = useFunnelStore((s) => Object.keys(s.modules).length);

  return (
    <div
      className="sticky top-0 z-30 border-b border-line bg-void"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto grid h-10 max-w-(--app-max) grid-cols-[1fr_auto_auto] items-center gap-3 px-(--gutter)">
        <TickRail progress={progress} height={16} />
        <span className="t-readout-s tnum text-ink-muted">
          {obtained}/{total}
        </span>
        <span className="t-readout-s tnum text-ink-muted">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}
