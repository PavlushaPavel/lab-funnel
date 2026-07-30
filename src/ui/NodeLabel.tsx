import { cn } from '../lib/cn';

export type NodeStatus = 'locked' | 'active' | 'done' | 'scanning';

interface NodeLabelProps {
  code: string;
  title: string;
  status?: NodeStatus;
  className?: string;
}

/**
 * Моно-лейбл с точкой статуса (DESIGN.md v3 §6 Моно-лейбл): техническая аннотация вида
 * `МОДУЛЬ 01 · АУДИТОРИЯ`. Формулировки нейтральные, приборного словаря нет.
 * Точка: чёрная — текущее, мята — сделано, --hairline — заперто, --ink-muted — загрузка.
 * Пульсации нет (§7: зацикленных анимаций в системе нет).
 */
const DOT_CLASS: Record<NodeStatus, string> = {
  locked: 'bg-hairline',
  active: 'bg-ink',
  done: 'bg-mint',
  scanning: 'bg-ink-muted',
};

export function NodeLabel({ code, title, status = 'active', className }: NodeLabelProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-pill', DOT_CLASS[status])}
        aria-hidden="true"
      />
      <span className="t-caption">
        {code}
        {title ? ` · ${title}` : ''}
      </span>
    </div>
  );
}
