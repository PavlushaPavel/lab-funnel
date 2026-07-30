/** Разделитель секций: линия --hairline, без градиентов (DESIGN.md v3 §2.2, §3). */
export function Divider() {
  return <hr role="separator" aria-hidden="true" className="h-px w-full border-none bg-hairline" />;
}
