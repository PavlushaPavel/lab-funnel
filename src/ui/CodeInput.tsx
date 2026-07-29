import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { cn } from '../lib/cn';
import { haptics } from '../lib/telegram';
import { durations, useReducedMotionSafe } from '../lib/motion';

interface CodeInputProps {
  length: number;
  onSubmit: (value: string) => boolean;
  hint?: string;
}

type Status = 'idle' | 'error' | 'success';

/** Ключевое слово-код: утопленные слоты + скрытый input (DESIGN.md §7 CodeInput). */
export function CodeInput({ length, onSubmit, hint }: CodeInputProps) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [shakeTick, setShakeTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    if (status !== 'idle' || value.length !== length) return;
    const ok = onSubmit(value);
    if (ok) {
      setStatus('success');
      haptics.success();
      return;
    }
    setStatus('error');
    haptics.error();
    setShakeTick((t) => t + 1);
    const timer = setTimeout(() => {
      setValue('');
      setStatus('idle');
    }, durations.codeClear * 1000);
    return () => clearTimeout(timer);
  }, [value, length, status, onSubmit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (status !== 'idle') return;
    const next = e.target.value
      .toUpperCase()
      .replace(/[^A-ZА-ЯЁ0-9]/g, '')
      .slice(0, length);
    if (next.length > value.length) haptics.light();
    setValue(next);
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <div className="grid gap-2">
      <p className="t-label text-ink-faint">ФОРМУЛА</p>
      <button
        key={shakeTick}
        type="button"
        onClick={focusInput}
        aria-label="Код доступа"
        className={cn(
          'grid w-full auto-cols-fr grid-flow-col gap-2 rounded-lg border-t border-line bg-sunken px-3 py-4',
          status === 'error' && !reduced && 'anim-shake'
        )}
        style={{ boxShadow: 'var(--shadow-well-inset)' }}
      >
        {Array.from({ length }).map((_, i) => {
          const char = value[i];
          const isCursor = i === value.length && status === 'idle';
          return (
            <span
              key={i}
              className={cn(
                'grid h-12 place-items-center rounded-sm border-b-2 text-center uppercase transition-colors',
                status === 'error' ? 'border-bad' : char ? 'border-acid' : 'border-line',
                status === 'success' && 'text-acid'
              )}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                color: status === 'success' ? undefined : 'var(--ink)',
                transitionDuration: '300ms',
                transitionDelay:
                  status === 'success' ? `${Math.round(i * durations.codeCascade * 1000)}ms` : '0ms',
              }}
            >
              {char ?? (isCursor && !reduced ? <span className="anim-cursor-blink text-acid">|</span> : '')}
            </span>
          );
        })}
      </button>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        maxLength={length}
        className="sr-only"
      />
      {hint && <p className="t-body-s text-center text-ink-muted">{hint}</p>}
    </div>
  );
}
