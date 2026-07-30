import { motion } from 'motion/react';
import { Lock, CheckCircle } from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import { springPanel, useReducedMotionSafe } from '../lib/motion';

export type ModuleBadgeState = 'locked' | 'active' | 'done';
export type ModuleBadgeSize = 'sm' | 'lg';

interface ModuleBadgeProps {
  /** Код модуля: «М-01». */
  code: string;
  /** Название модуля: «АУДИТОРИЯ» / «ОФФЕРЫ» / «СТРАНИЦА». */
  title: string;
  state: ModuleBadgeState;
  size?: ModuleBadgeSize;
  className?: string;
}

/**
 * Статус модуля (DESIGN.md v3 §6): моно-код + название + состояние доступа.
 * Плоские поверхности без рамок: заперто — --mist, текущее — белая карточка,
 * открыто — --mint (§3: мята и есть статус «сделано»). Приборных формулировок нет.
 */
const STATE_CLASS: Record<ModuleBadgeState, { bg: string; code: string }> = {
  locked: { bg: 'bg-mist', code: 'text-ink-muted' },
  active: { bg: 'bg-card', code: 'text-ink' },
  done: { bg: 'bg-mint', code: 'text-ink' },
};

const STATE_LABEL: Record<ModuleBadgeState, string> = {
  locked: 'закрыт',
  active: 'текущий',
  done: 'открыт',
};

export function ModuleBadge({ code, title, state, size = 'lg', className }: ModuleBadgeProps) {
  const reduced = useReducedMotionSafe();
  const c = STATE_CLASS[state];
  const isLg = size === 'lg';
  const iconSize = isLg ? 20 : 14;

  return (
    <motion.div
      key={state}
      animate={reduced ? undefined : { scale: [1, 1.03, 1] }}
      transition={springPanel}
      className={cn(
        'inline-flex items-center gap-3 rounded-card',
        isLg ? 'px-4 py-3' : 'px-3 py-2',
        c.bg,
        className
      )}
      role="img"
      aria-label={`Модуль ${code}, ${title}, ${STATE_LABEL[state]}`}
    >
      {state === 'locked' && (
        <Lock weight="regular" size={iconSize} color="var(--ink-muted)" aria-hidden="true" />
      )}
      {state === 'active' && (
        <span
          className={cn('shrink-0 rounded-pill bg-ink', isLg ? 'h-2 w-2' : 'h-1.5 w-1.5')}
          aria-hidden="true"
        />
      )}
      {state === 'done' && (
        <CheckCircle weight="regular" size={iconSize} color="var(--ink)" aria-hidden="true" />
      )}
      <div className="grid gap-1" aria-hidden="true">
        <span className={cn('t-caption', c.code)}>{code}</span>
        {/* Onest 500 uppercase: сжатый дисплей мельче 28px не применяется (§2.7) */}
        <span className={cn(isLg ? 't-heading' : 't-body-sm', 'uppercase text-ink')}>{title}</span>
      </div>
    </motion.div>
  );
}
