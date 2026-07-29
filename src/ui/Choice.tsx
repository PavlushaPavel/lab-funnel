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

/** Вариант ответа. Визуал — DESIGN.md §7 Choice. */
export function Choice({ index, state, onSelect, children, className }: ChoiceProps) {
  const label = String(index + 1).padStart(2, '0');

  const handleClick = () => {
    haptics.light();
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'grid min-h-14 w-full grid-cols-[24px_1fr] items-center gap-3 rounded-md border bg-panel px-4 py-3 text-left',
        state === 'idle' && 'border-line',
        state === 'selected' && 'border-line-signal bg-signal-dim',
        state === 'correct' && 'border-line',
        state === 'wrong' && 'border-line anim-shake',
        className
      )}
      style={{
        borderLeftWidth: state === 'correct' || state === 'wrong' ? 2 : 1,
        borderLeftColor:
          state === 'correct' ? 'var(--signal)' : state === 'wrong' ? 'var(--bad)' : undefined,
      }}
    >
      {state === 'correct' ? (
        <Check weight="regular" size={18} color="var(--signal)" aria-hidden="true" />
      ) : (
        <span
          className={cn('t-readout-s', state === 'selected' ? 'text-signal' : 'text-ink-faint')}
        >
          {label}
        </span>
      )}
      <span className="t-body text-ink">{children}</span>
    </button>
  );
}
