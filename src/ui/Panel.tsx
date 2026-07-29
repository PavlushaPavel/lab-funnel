import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type PanelStatus = 'locked' | 'active' | 'done' | 'scanning';

interface PanelProps {
  label?: string;
  status?: PanelStatus;
  children: ReactNode;
  className?: string;
}

const DOT_CLASS: Record<PanelStatus, string> = {
  locked: 'bg-ink-faint',
  active: 'bg-acid',
  // done — «этап завершён», не «доступ открыт» (тот — только у ModuleBadge/§6.1),
  // поэтому кислота, а не небо: --sky зарезервирован строго под правило DESIGN.md §2.9.
  done: 'bg-acid',
  scanning: 'bg-rust anim-pulse-warn',
};

/** Панель — базовая поверхность интерфейса. Глубина через верхний блик, не через тень (DESIGN.md §7). */
export function Panel({ label, status = 'active', children, className }: PanelProps) {
  return (
    <div
      className={cn('rounded-lg border border-line bg-panel p-4', className)}
      style={{ boxShadow: 'var(--shadow-panel-sheen)' }}
    >
      {label && (
        <div className="mb-3 inline-flex items-center gap-2">
          <span className={cn('h-1 w-1 shrink-0 rounded-full', DOT_CLASS[status])} aria-hidden="true" />
          <span className="t-label">{label}</span>
        </div>
      )}
      {children}
    </div>
  );
}
