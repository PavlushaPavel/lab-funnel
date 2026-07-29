/**
 * Зерно и свет поверх всего приложения — один раз в App (DESIGN.md §6.6).
 * Два фиксированных слоя: шум feTurbulence и очень слабое тёплое пятно света
 * сверху экрана — натриевый фонарь над пустыней. Оба pointer-events:none.
 */
export function Grain() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background:
            'radial-gradient(ellipse 120% 55% at 50% -10%, color-mix(in srgb, var(--rust) 5%, transparent), transparent 70%)',
        }}
      />
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
        style={{ opacity: 0.03, mixBlendMode: 'overlay' }}
      >
        <filter id="lab-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#lab-grain)" />
      </svg>
    </>
  );
}
