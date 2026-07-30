import type { ReactNode } from 'react';

/** Цитата автора (DESIGN.md v3 §4): левая линия 2px --ink, текст --ink-secondary, без курсива. */
export function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote
      className="t-body text-ink-secondary"
      style={{
        borderLeft: '2px solid var(--ink)',
        paddingLeft: 'var(--sp-2)',
        fontStyle: 'normal',
      }}
    >
      {children}
    </blockquote>
  );
}
