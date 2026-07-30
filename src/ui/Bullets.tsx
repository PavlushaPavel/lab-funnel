/**
 * Список пунктов (DESIGN.md v3 §3, §4): точка-маркер --ink: --voltage зарезервирован под точечную подсветку, один из двух разрешённых
 * микроакцентов, текст Onest 16px с мерой ≤40ch. Раскладка на CSS Grid.
 */
export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-(--sp-2)">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[8px_1fr] items-start gap-(--sp-2)">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-ink"
            aria-hidden="true"
          />
          <span className="t-body text-ink">{item}</span>
        </li>
      ))}
    </ul>
  );
}
