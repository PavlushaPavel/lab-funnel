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
 * Карточка статуса модуля — замена `ElementTile` (аудит продукта: клетка периодической
 * таблицы с «атомной массой» и символом элемента протаскивала химическую вселенную в
 * продуктовую логику, выдавая выдуманные числа за реальные данные). Показывает только код,
 * название и статус доступа. Тёмный приборный стиль (границы, --acid/--sky) сохранён —
 * снят только химический смысловой слой.
 */
const STATE_CLASS: Record<ModuleBadgeState, { border: string; bg: string; text: string }> = {
  locked: { border: 'border-line', bg: 'bg-panel', text: 'text-ink-faint' },
  active: { border: 'border-line-acid', bg: 'bg-panel', text: 'text-acid' },
  done: { border: 'border-sky', bg: 'bg-sky-dim', text: 'text-sky' },
};

const STATE_LABEL: Record<ModuleBadgeState, string> = {
  locked: 'заперт',
  active: 'проверяется',
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
        'inline-flex items-center gap-3 rounded-md border',
        isLg ? 'px-4 py-3' : 'px-3 py-2',
        c.border,
        c.bg,
        className
      )}
      role="img"
      aria-label={`Модуль ${code}, ${title}, ${STATE_LABEL[state]}`}
    >
      {state === 'locked' && (
        <Lock weight="regular" size={iconSize} className={c.text} aria-hidden="true" />
      )}
      {state === 'active' && (
        <span className={cn('shrink-0 rounded-full bg-acid', isLg ? 'h-2 w-2' : 'h-1.5 w-1.5')} aria-hidden="true" />
      )}
      {state === 'done' && (
        <CheckCircle weight="regular" size={iconSize} className={c.text} aria-hidden="true" />
      )}
      <div className="grid gap-0.5" aria-hidden="true">
        <span className={cn('t-label leading-none', c.text)}>{code}</span>
        <span className={cn(isLg ? 't-h2' : 't-body-s', 'leading-tight text-ink')}>{title}</span>
      </div>
    </motion.div>
  );
}
