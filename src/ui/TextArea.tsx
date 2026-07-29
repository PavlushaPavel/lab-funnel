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
 * Свободный ввод результата практики (ARCHITECTURE.md §7). Не декорация — единственное
 * место, где приложение получает доказательство, что человек реально что-то сделал
 * (PRODUCT.md §3.4). Валидация длины — забота экрана-владельца (disabled на кнопке
 * «Дальше»), сам примитив только собирает текст.
 */
export function TextArea({ value, onChange, placeholder, minLength, rows = 5, className }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      minLength={minLength}
      rows={rows}
      className={cn(
        'w-full resize-none rounded-lg border-t border-line bg-sunken px-4 py-3 t-body text-ink placeholder:text-ink-faint',
        className
      )}
      style={{ boxShadow: 'var(--shadow-well-inset)' }}
    />
  );
}
