import { cn } from '../lib/cn';

export type NodeStatus = 'locked' | 'active' | 'done' | 'scanning';

interface NodeLabelProps {
  code: string;
  title: string;
  status?: NodeStatus;
  className?: string;
}

const DOT_CLASS: Record<NodeStatus, string> = {
  locked: 'bg-ink-faint',
  active: 'bg-signal',
  done: 'bg-signal',
  scanning: 'bg-warn anim-pulse-warn',
};

/** Маркировка узла: `М-01 · АУДИТОРИЯ` + статус-точка (DESIGN.md §6.2). */
export function NodeLabel({ code, title, status = 'active', className }: NodeLabelProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('h-1 w-1 shrink-0 rounded-full', DOT_CLASS[status])} aria-hidden="true" />
      <span className="t-label">
        {code}
        {title ? ` · ${title}` : ''}
      </span>
    </div>
  );
}
