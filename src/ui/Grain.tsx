/** Зерно поверх всего приложения — один раз в App (DESIGN.md §6.5). */
export function Grain() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      style={{ opacity: 0.028, mixBlendMode: 'overlay' }}
    >
      <filter id="lab-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#lab-grain)" />
    </svg>
  );
}
