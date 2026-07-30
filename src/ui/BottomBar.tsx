import type { ReactNode } from 'react';

/**
 * Липкая нижняя панель действия (DESIGN.md v3 §5): плоская, на --canvas,
 * с верхней границей --hairline, высота --bar-h, safe-area обязательна.
 */
interface BottomBarProps {
  hint?: string;
  children: ReactNode;
}

export function BottomBar({ hint, children }: BottomBarProps) {
  return (
    <div
      className="sticky bottom-0 z-30 border-t border-hairline bg-canvas"
      style={{ paddingBottom: 'max(var(--sp-2), env(safe-area-inset-bottom))' }}
    >
      <div
        className="mx-auto grid max-w-(--app-max) gap-2 px-(--gutter) pt-3"
        style={{ minHeight: 'var(--bar-h)' }}
      >
        {hint && <p className="t-caption text-center">{hint}</p>}
        {children}
      </div>
    </div>
  );
}
