import type { ReactNode } from 'react';

/** Цитата автора: левая линия, курсив не применяется (DESIGN.md §4). */
export function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote
      className="t-body text-ink-muted"
      style={{ borderLeft: '2px solid var(--line-strong)', paddingLeft: 14, fontStyle: 'normal' }}
    >
      {children}
    </blockquote>
  );
}
