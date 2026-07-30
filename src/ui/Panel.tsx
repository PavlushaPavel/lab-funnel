import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type PanelStatus = 'locked' | 'active' | 'done' | 'scanning';

interface PanelProps {
  label?: string;
  status?: PanelStatus;
  children: ReactNode;
  className?: string;
}

/**
 * Белая карточка — основная контентная поверхность (DESIGN.md v3 §6).
 * Без тени и без рамки: от холста --canvas её отделяет только контраст поверхности (§2.1, §2.8).
 * Статус-точка нейтральна: чёрная — текущее, мята — сделано, --hairline — заперто.
 * Зацикленной пульсации у «scanning» больше нет (§7: бесконечных анимаций в системе нет).
 */
const DOT_CLASS: Record<PanelStatus, string> = {
  locked: 'bg-hairline',
  active: 'bg-ink',
  done: 'bg-mint',
  scanning: 'bg-ink-muted',
};

export function Panel({ label, status = 'active', children, className }: PanelProps) {
  return (
    <div className={cn('rounded-card bg-card p-(--card-pad)', className)}>
      {label && (
        <div className="mb-3 inline-flex items-center gap-2">
          <span
            className={cn('h-1.5 w-1.5 shrink-0 rounded-pill', DOT_CLASS[status])}
            aria-hidden="true"
          />
          <span className="t-caption">{label}</span>
        </div>
      )}
      {children}
    </div>
  );
}
