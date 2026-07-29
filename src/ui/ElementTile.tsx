import { motion } from 'motion/react';
import { Lock } from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import { springPanel, useReducedMotionSafe } from '../lib/motion';

export type ElementState = 'locked' | 'active' | 'obtained';
export type ElementSize = 'sm' | 'md' | 'lg';

interface ElementTileProps {
  /** Атомный номер — порядковый номер модуля: «01», «02», «03». */
  number: string;
  /** Символ элемента: две кириллические буквы, как в таблице Менделеева. */
  symbol: string;
  /** Полное название модуля. */
  name: string;
  /** «Атомная масса» — процент утечки, который закрывает модуль. Число настоящее (LEAK_WEIGHTS). */
  mass: number;
  state: ElementState;
  size?: ElementSize;
  className?: string;
}

/**
 * Клетка периодической таблицы — главный приём системы (DESIGN.md §6.1).
 *
 * Один и тот же объект проходит через всю воронку: подводка к модулю, сцена разблокировки,
 * инвентарь, финальный синтез, продающий экран. За счёт этого интерфейс узнаётся с первого
 * взгляда и не выглядит сгенерированным.
 *
 * Важно: «масса» — не декоративное число. Это процент утечки, который закрывает модуль,
 * поэтому клетка несёт реальные данные воронки, а не изображает антураж.
 */

// Размеры подобраны так, чтобы служебный текст нигде не опускался ниже 12px (DESIGN.md §2.13).
const SIZE: Record<ElementSize, { width: number; symbol: number; gap: string }> = {
  sm: { width: 76, symbol: 20, gap: 'gap-1' },
  md: { width: 104, symbol: 30, gap: 'gap-1.5' },
  lg: { width: 136, symbol: 40, gap: 'gap-2' },
};

// Цвета состояний. --sky появляется ТОЛЬКО на «получено» — правило DESIGN.md §2.9.
const STATE: Record<ElementState, { border: string; bg: string; symbol: string; name: string; meta: string }> = {
  locked: {
    border: 'border-line',
    bg: 'bg-panel',
    symbol: 'text-ink-faint',
    name: 'text-ink-faint',
    meta: 'text-ink-faint',
  },
  active: {
    border: 'border-line-acid',
    bg: 'bg-panel',
    symbol: 'text-acid',
    name: 'text-ink',
    meta: 'text-ink-muted',
  },
  obtained: {
    border: 'border-sky',
    bg: 'bg-sky-dim',
    symbol: 'text-sky',
    name: 'text-ink',
    meta: 'text-ink-muted',
  },
};

const STATE_LABEL: Record<ElementState, string> = {
  locked: 'заперт',
  active: 'доступен',
  obtained: 'получен',
};

export function ElementTile({
  number,
  symbol,
  name,
  mass,
  state,
  size = 'md',
  className,
}: ElementTileProps) {
  const reduced = useReducedMotionSafe();
  const s = SIZE[size];
  const c = STATE[state];

  return (
    <motion.div
      // Ключ по состоянию: переход «заперт → получен» проигрывается как короткий импульс,
      // а не как мгновенная перекраска. При reduced motion импульса нет.
      animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
      key={state}
      transition={springPanel}
      style={{ width: s.width }}
      className={cn(
        'relative flex shrink-0 flex-col items-center justify-between rounded-sm border px-2 py-2.5',
        s.gap,
        c.border,
        c.bg,
        className
      )}
      role="img"
      aria-label={`Модуль ${number}, ${name}, закрывает ${mass} процентов утечки, ${STATE_LABEL[state]}`}
    >
      {/* Верхняя строка: атомный номер слева, замок справа у запертой клетки */}
      <div className="flex w-full items-start justify-between">
        <span className={cn('t-readout-s leading-none', c.meta)} aria-hidden="true">
          {number}
        </span>
        {state === 'locked' && <Lock size={12} weight="regular" className="text-ink-faint" aria-hidden="true" />}
      </div>

      {/* Символ элемента */}
      <span
        className={cn('t-symbol leading-none', c.symbol)}
        style={{ fontSize: s.symbol }}
        aria-hidden="true"
      >
        {symbol}
      </span>

      {/* Название и «атомная масса» */}
      <div className="flex w-full flex-col items-center gap-0.5">
        <span className={cn('t-label text-center leading-tight', c.name)} aria-hidden="true">
          {name}
        </span>
        <span className={cn('t-readout-s leading-none', c.meta)} aria-hidden="true">
          {mass}
        </span>
      </div>
    </motion.div>
  );
}
