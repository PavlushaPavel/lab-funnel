import { useFunnelStore, selectProgress, selectPhase, type Phase } from '../store/funnel';
import { TickRail } from './TickRail';
import { cn } from '../lib/cn';

const PHASES: { id: Phase; label: string }[] = [
  { id: 'know', label: 'ЗНАЮ' },
  { id: 'want', label: 'ХОЧУ' },
  { id: 'believe', label: 'ВЕРЮ' },
  { id: 'pay', label: 'ПЛАЧУ' },
];

/** Верхний рельс: сама читает стор (DESIGN.md §7 ProgressRail). Прогресс + открытые фазы воронки. */
export function ProgressRail() {
  const progress = useFunnelStore(selectProgress);
  const phase = useFunnelStore(selectPhase);
  const activeIdx = PHASES.findIndex((p) => p.id === phase);

  return (
    <div
      className="sticky top-0 z-30 border-b border-line bg-void"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto grid h-10 max-w-(--app-max) grid-cols-[1fr_auto] items-center gap-3 px-(--gutter)">
        <TickRail progress={progress} height={16} />
        <span className="t-readout-s text-ink-muted">{Math.round(progress * 100)}%</span>
      </div>
      <div className="mx-auto grid max-w-(--app-max) grid-cols-4 gap-1 px-(--gutter) pb-2">
        {PHASES.map((p, i) => (
          <span
            key={p.id}
            className={cn(
              't-label text-center',
              i === activeIdx && 'text-signal',
              i < activeIdx && 'text-ink-muted',
              i > activeIdx && 'text-ink-faint'
            )}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
