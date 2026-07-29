import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { ArrowsLeftRight, Info } from '@phosphor-icons/react';
import type { Spec } from '../store/funnel';
import type { BeforeAfterData } from '../content/mechanics';
import { haptics } from '../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../lib/motion';
import { mechanicsDurations, mechanicsLayout } from './localMotion';

interface BeforeAfterProps {
  data: BeforeAfterData;
  spec: Spec;
  onComplete: (result?: unknown) => void;
}

/** Стилизованный wireframe "ДО" — бедный, серый, с очевидными дырами. Рисуется кодом, без картинок. */
function WireframeBefore() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-3 p-4">
      <div className="grid grid-cols-[24px_1fr] items-center gap-2">
        <div className="h-3 w-3 rounded-sm bg-raised" />
        <div className="h-2 w-16 rounded-sm bg-raised" />
      </div>
      <div className="grid content-start gap-3">
        <div className="h-4 w-2/3 rounded-sm bg-raised" />
        <div className="h-2 w-1/3 rounded-sm bg-raised opacity-60" />
        <div className="mt-2 h-8 w-24 rounded-sm border border-line-strong" />
        <div className="mt-6 grid gap-2 border-t border-dashed border-line pt-4">
          <div className="h-2 w-1/2 rounded-sm bg-raised opacity-40" />
          <div className="h-2 w-1/3 rounded-sm bg-raised opacity-40" />
        </div>
        <div className="mt-10 h-2 w-1/4 justify-self-center rounded-sm bg-raised opacity-30" />
      </div>
    </div>
  );
}

/** Стилизованный wireframe "ПОСЛЕ" — собранный, со структурой и кислотным акцентом. */
function WireframeAfter() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-3 p-4">
      <div className="grid grid-cols-[24px_1fr_auto] items-center gap-2">
        <div className="h-3 w-3 rounded-sm bg-acid" />
        <div className="h-2 w-16 rounded-sm bg-raised" />
        <div className="h-5 w-14 rounded-sm bg-acid-dim" />
      </div>
      <div className="grid content-start gap-2">
        <div className="h-4 w-5/6 rounded-sm bg-ink" style={{ opacity: 0.85 }} />
        <div className="h-2 w-2/3 rounded-sm bg-raised" />
        <div className="h-2 w-1/2 rounded-sm bg-raised" />
        <div className="mt-2 h-9 w-28 rounded-sm bg-acid" />
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="h-14 rounded-sm border border-line bg-panel" />
          <div className="h-14 rounded-sm border border-line-acid bg-acid-dim" />
          <div className="h-14 rounded-sm border border-line bg-panel" />
        </div>
        <div className="mt-4 grid gap-1 rounded-sm border-l-2 border-line-strong bg-panel p-2">
          <div className="h-2 w-3/4 rounded-sm bg-raised" />
          <div className="h-2 w-1/2 rounded-sm bg-raised" />
        </div>
      </div>
      <div className="h-10 rounded-sm bg-acid" />
    </div>
  );
}

/**
 * «До / после» (PRODUCT.md §4.5). Слайдер-шторка по двум кодовым wireframe-макетам, drag через
 * useMotionValue (ARCHITECTURE.md §11.8). Маркеры поверх раскрывают пояснения из модулей 1 и 2.
 * onComplete — после просмотра всех маркеров.
 */
export function BeforeAfter({ data, onComplete }: BeforeAfterProps) {
  const reduced = useReducedMotionSafe();
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const pct = useTransform(x, (latest) => {
    const track = trackRef.current;
    if (!track) return mechanicsLayout.sliderInitialSplit;
    const width = track.offsetWidth;
    if (width <= 0) return mechanicsLayout.sliderInitialSplit;
    return Math.max(0, Math.min(100, (latest / width) * 100));
  });
  const clipBefore = useTransform(pct, (p) => `inset(0 ${100 - p}% 0 0)`);

  const [openMarker, setOpenMarker] = useState<string | null>(null);
  const [viewed, setViewed] = useState<Record<string, boolean>>({});
  const completedRef = useRef(false);

  // Стартовое положение шторки — доля ширины трека, выставляется один раз после измерения.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    x.set((track.offsetWidth * mechanicsLayout.sliderInitialSplit) / 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- x (motion value) стабилен между рендерами
  }, []);

  const toggleMarker = (id: string) => {
    haptics.light();
    setOpenMarker((prev) => (prev === id ? null : id));
    setViewed((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: true };
      const allViewed = data.markers.every((m) => next[m.id]);
      if (allViewed && !completedRef.current) {
        completedRef.current = true;
        haptics.success();
        onComplete({ viewed: data.markers.length });
      }
      return next;
    });
  };

  return (
    <div className="grid gap-3">
      <p className="t-body-s text-ink-muted">
        Потяни шторку. Слева — макет, каким страница была бы без анализа. Справа — собранный из
        того, что ты уже прошёл.
      </p>

      <div
        ref={trackRef}
        className="relative overflow-hidden rounded-lg border border-line bg-sunken"
        style={{ aspectRatio: '3 / 4', boxShadow: 'var(--shadow-well-inset)' }}
      >
        {/* Нижний слой — "после", виден целиком. */}
        <div className="absolute inset-0 bg-panel">
          <WireframeAfter />
        </div>

        {/* Верхний слой — "до", обрезан по положению шторки. Шторка — прямое управление (drag),
            не декоративная анимация, поэтому остаётся активной и при reduced-motion. */}
        <motion.div className="absolute inset-0 bg-panel" style={{ clipPath: clipBefore }}>
          <WireframeBefore />
        </motion.div>

        {/* Ручка-шторка: позиция — исключительно через motion value x (transform), без useState на кадр. */}
        <motion.div
          className="absolute inset-y-0 left-0 z-20 -ml-3 w-6 cursor-ew-resize touch-none"
          style={{ x }}
          drag="x"
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => haptics.light()}
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-acid" />
          <div
            className="absolute top-1/2 left-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-raised"
            style={{ boxShadow: 'var(--shadow-panel-sheen)' }}
          >
            <ArrowsLeftRight weight="regular" size={14} color="var(--ink)" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Маркеры. Фон меток намеренно --bg-panel (а не --bg-raised, как блоки самого макета) —
            иначе непросмотренная метка сливается с "мебелью" wireframe-а. Плюс контрастная
            рамка и иконка Info вместо плоской точки — понятная аффорданса поверх плотной картинки. */}
        {data.markers.map((marker) => (
          <button
            key={marker.id}
            type="button"
            onClick={() => toggleMarker(marker.id)}
            aria-expanded={openMarker === marker.id}
            className="absolute z-30 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            <span
              className="grid h-7 w-7 place-items-center rounded-full border-2"
              style={{
                background: viewed[marker.id] ? 'var(--acid)' : 'var(--bg-panel)',
                borderColor: viewed[marker.id] ? 'var(--acid)' : 'var(--ink)',
                boxShadow: 'var(--shadow-panel-sheen)',
              }}
            >
              <Info
                weight="bold"
                size={14}
                color={viewed[marker.id] ? 'var(--ink-invert)' : 'var(--ink)'}
                aria-hidden="true"
              />
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {openMarker && (
          <motion.p
            key={openMarker}
            className="t-body-s text-ink"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : mechanicsDurations.beforeAfterNoteReveal, ease: easeOut }}
          >
            {data.markers.find((m) => m.id === openMarker)?.note}
          </motion.p>
        )}
      </AnimatePresence>

      {/* .t-label задаёт цвет ink-faint неслойным CSS-правилом, которое перебивает слойные
          Tailwind-утилиты text-*, поэтому цвет — инлайн-стилем. */}
      <p
        className="t-label"
        style={{ color: Object.keys(viewed).length === data.markers.length ? 'var(--acid)' : undefined }}
      >
        ТОЧЕК ОСМОТРЕНО {Object.keys(viewed).length} ИЗ {data.markers.length}
      </p>
    </div>
  );
}
