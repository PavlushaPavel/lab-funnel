import type { ReactNode } from 'react';
import { Check } from '@phosphor-icons/react';
import { cn } from '../lib/cn';
import { haptics } from '../lib/telegram';

type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong';

interface ChoiceProps {
  index: number;
  state: ChoiceState;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Вариант ответа (DESIGN.md v3 §6 Choice). Белая карточка --r-card, минимум 56px,
 * слева моно-индекс `01`. selected/correct — заливка --mint, wrong — рамка --alert + shake.
 * Рамки на спокойных состояниях нет: разделение идёт контрастом поверхности (§2.8).
 */
export function Choice({ index, state, onSelect, children, className }: ChoiceProps) {
  const label = String(index + 1).padStart(2, '0');

  const handleClick = () => {
    haptics.light();
    onSelect();
  };

  const isMint = state === 'selected' || state === 'correct';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'grid min-h-14 w-full grid-cols-[24px_1fr] items-center gap-3 rounded-card px-4 py-3 text-left',
        isMint ? 'bg-mint' : 'bg-card',
        state === 'wrong' && 'anim-shake',
        className
      )}
      style={{
        border: state === 'wrong' ? '1.5px solid var(--alert)' : undefined,
      }}
    >
      {state === 'correct' ? (
        <Check weight="regular" size={18} color="var(--ink)" aria-hidden="true" />
      ) : (
        <span className={cn('t-caption', state === 'selected' ? 'text-ink' : 'text-ink-muted')}>
          {label}
        </span>
      )}
      <span className="t-body text-ink">{children}</span>
    </button>
  );
}
