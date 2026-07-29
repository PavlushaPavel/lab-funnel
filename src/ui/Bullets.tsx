/** Список пунктов: маркер + текст через CSS Grid (без flex-математики). */
export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[16px_1fr] gap-2">
          <span className="t-label text-ink-faint" aria-hidden="true">
            —
          </span>
          <span className="t-body text-ink">{item}</span>
        </li>
      ))}
    </ul>
  );
}
