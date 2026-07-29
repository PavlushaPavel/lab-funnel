import type { ReactNode } from 'react';

interface BottomBarProps {
  hint?: string;
  children: ReactNode;
}

/** Липкая нижняя панель действия с safe-area (высота --bar-h, ARCHITECTURE.md §7). */
export function BottomBar({ hint, children }: BottomBarProps) {
  return (
    <div
      className="sticky bottom-0 z-30 border-t border-line bg-void"
      style={{ paddingBottom: 'max(var(--sp-4), env(safe-area-inset-bottom))' }}
    >
      <div
        className="mx-auto grid max-w-(--app-max) gap-2 px-(--gutter) pt-3"
        style={{ minHeight: 'var(--bar-h)' }}
      >
        {hint && <p className="t-label text-center text-ink-faint">{hint}</p>}
        {children}
      </div>
    </div>
  );
}
