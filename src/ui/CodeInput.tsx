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

/**
 * Поле кода (DESIGN.md v3 §6 CodeInput): ряд слотов на --mist с --r-input, моно заглавные 22px.
 * Активный слот — нижняя граница 2px --ink. Ошибка — граница --alert + shake.
 * Успех — слоты последовательно заливаются --mint. Ни тени, ни утопленности: мир плоский (§2.1).
 */
const SLOT_UNDERLINE = 2;

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
      <p className="t-caption">Ключевое слово</p>
      <button
        key={shakeTick}
        type="button"
        onClick={focusInput}
        aria-label="Ключевое слово"
        className={cn(
          'grid w-full auto-cols-fr grid-flow-col gap-2',
          status === 'error' && !reduced && 'anim-shake'
        )}
      >
        {Array.from({ length }).map((_, i) => {
          const char = value[i];
          const isActive = i === value.length && status === 'idle';
          return (
            <span
              key={i}
              className="grid h-14 place-items-center rounded-input text-center uppercase transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                color: 'var(--ink)',
                // Успех — последовательная заливка мятой; в остальных состояниях слот на --mist
                backgroundColor: status === 'success' ? 'var(--mint)' : 'var(--mist)',
                // Ошибка — граница --alert. Активный слот — нижняя линия 2px --ink.
                border: status === 'error' ? '1.5px solid var(--alert)' : undefined,
                borderBottom:
                  status === 'error'
                    ? '1.5px solid var(--alert)'
                    : `${SLOT_UNDERLINE}px solid ${isActive ? 'var(--ink)' : 'transparent'}`,
                transitionDuration: `${Math.round(durations.tickDraw * 1000)}ms`,
                transitionDelay:
                  status === 'success' ? `${Math.round(i * durations.codeCascade * 1000)}ms` : '0ms',
              }}
            >
              {char ?? (isActive && !reduced ? <span className="anim-cursor-blink">|</span> : '')}
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
      {hint && (
        <p className={cn('t-body-sm text-center', status === 'error' ? 'text-alert' : 'text-ink-muted')}>
          {hint}
        </p>
      )}
    </div>
  );
}
