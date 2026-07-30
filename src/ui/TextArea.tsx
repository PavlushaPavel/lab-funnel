import { cn } from '../lib/cn';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  rows?: number;
  className?: string;
}

/**
 * Поле ввода практики (DESIGN.md v3 §6 TextArea): фон --mist, --r-input, без рамки,
 * фокус через outline 2px --ink, минимум 96px высоты.
 * Валидация длины — забота экрана-владельца, примитив только собирает текст.
 */
export function TextArea({
  value,
  onChange,
  placeholder,
  minLength,
  rows = 5,
  className,
}: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      minLength={minLength}
      rows={rows}
      className={cn(
        't-body min-h-24 w-full resize-none rounded-input border-none bg-mist px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        className
      )}
      style={{ maxWidth: '100%' }}
    />
  );
}
