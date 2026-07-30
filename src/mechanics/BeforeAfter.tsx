import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { ArrowsLeftRight, Check, Info } from '@phosphor-icons/react';
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

/**
 * Стилизованный wireframe «ДО» — тусклый: белая страница, на которой всё содержимое
 * осталось серыми болванками --mist, а текст читается как --ink-muted. Рисуется кодом.
 */
function WireframeBefore() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-3 bg-card p-4">
      <div className="grid grid-cols-[24px_1fr] items-center gap-2">
        <div className="h-3 w-3 rounded-button bg-mist" />
        <div className="h-2 w-16 rounded-button bg-mist" />
      </div>
      <div className="grid content-start gap-3">
        <div className="h-4 w-2/3 rounded-button bg-ink-muted" />
        <div className="h-2 w-1/3 rounded-button bg-mist" />
        <div
          className="mt-2 h-8 w-24 rounded-button"
          style={{ border: '1.5px solid var(--hairline)' }}
        />
        <div
          className="mt-6 grid gap-2 pt-4"
          style={{ borderTop: '1px solid var(--hairline)' }}
        >
          <div className="h-2 w-1/2 rounded-button bg-mist" />
          <div className="h-2 w-1/3 rounded-button bg-mist" />
        </div>
        <div className="mt-10 h-2 w-1/4 justify-self-center rounded-button bg-mist" />
      </div>
    </div>
  );
}

/**
 * Стилизованный wireframe «ПОСЛЕ» — живой: серый холст с собранными белыми карточками,
 * чёрным текстом и мятным акцентом на кнопке. Тот же язык, что у самого приложения (§3).
 */
function WireframeAfter() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-3 bg-mist p-4">
      <div className="grid grid-cols-[24px_1fr_auto] items-center gap-2">
        <div className="h-3 w-3 rounded-button bg-ink" />
        <div className="h-2 w-16 rounded-button bg-ink-muted" />
        <div className="h-5 w-14 rounded-pill bg-mint" />
      </div>
      <div className="grid content-start gap-2">
        <div className="h-4 w-5/6 rounded-button bg-ink" />
        <div className="h-2 w-2/3 rounded-button bg-ink-muted" />
        <div className="h-2 w-1/2 rounded-button bg-ink-muted" />
        <div className="mt-2 h-9 w-28 rounded-button bg-mint" />
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="h-14 rounded-card bg-card" />
          <div className="h-14 rounded-card bg-card" />
          <div className="h-14 rounded-card bg-card" />
        </div>
        <div className="mt-4 grid gap-1 rounded-card bg-card p-2">
          <div className="h-2 w-3/4 rounded-button bg-ink-muted" />
          <div className="h-2 w-1/2 rounded-button bg-ink-muted" />
        </div>
      </div>
      <div className="h-10 rounded-button bg-inverted" />
    </div>
  );
}

/**
 * «До / после» (PRODUCT.md §4.5). Слайдер-шторка по двум кодовым wireframe-макетам, drag через
 * useMotionValue (ARCHITECTURE.md §11.8). Маркеры поверх раскрывают пояснения из модулей 1 и 2.
 * onComplete — после просмотра всех маркеров.
 *
 * Мир v3 (DESIGN.md §2.1, §3): теней нет вообще, маркеры читаются поверх плотного макета за
 * счёт инверсного круга с белой иконкой, а не за счёт свечения и рамок тёмного мира.
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

  const allViewed = Object.keys(viewed).length === data.markers.length;

  return (
    <div className="grid gap-(--sp-2)">
      <p className="t-body-sm text-ink-secondary">
        Потяни шторку. Слева — макет, каким страница была бы без анализа. Справа — собранный из
        того, что ты уже прошёл.
      </p>

      <div
        ref={trackRef}
        className="relative overflow-hidden rounded-card bg-card"
        style={{ aspectRatio: '3 / 4' }}
      >
        {/* Нижний слой — "после", виден целиком. */}
        <div className="absolute inset-0">
          <WireframeAfter />
        </div>

        {/* Верхний слой — "до", обрезан по положению шторки. Шторка — прямое управление (drag),
            не декоративная анимация, поэтому остаётся активной и при reduced-motion. */}
        <motion.div className="absolute inset-0" style={{ clipPath: clipBefore }}>
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
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-ink" />
          <div
            className="absolute top-1/2 left-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-card"
            style={{ border: '1.5px solid var(--ink)' }}
          >
            <ArrowsLeftRight weight="regular" size={16} color="var(--ink)" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Маркеры: инверсный круг с белой иконкой — единственное, что гарантированно читается
            поверх любого места макета. Просмотренный маркер уходит в мяту со статусом «сделано». */}
        {data.markers.map((marker) => (
          <button
            key={marker.id}
            type="button"
            onClick={() => toggleMarker(marker.id)}
            aria-expanded={openMarker === marker.id}
            className="absolute z-30 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            <span
              className="grid h-7 w-7 place-items-center rounded-pill"
              style={{ background: viewed[marker.id] ? 'var(--mint)' : 'var(--inverted)' }}
            >
              {viewed[marker.id] ? (
                <Check weight="regular" size={14} color="var(--ink)" aria-hidden="true" />
              ) : (
                <Info weight="regular" size={14} color="var(--ink-inverted)" aria-hidden="true" />
              )}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {openMarker && (
          <motion.p
            key={openMarker}
            className="t-body-sm text-ink"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : mechanicsDurations.beforeAfterNoteReveal, ease: easeOut }}
          >
            {data.markers.find((m) => m.id === openMarker)?.note}
          </motion.p>
        )}
      </AnimatePresence>

      <p className={allViewed ? 't-caption tnum text-ink' : 't-caption tnum'}>
        ТОЧЕК ОСМОТРЕНО {Object.keys(viewed).length} ИЗ {data.markers.length}
      </p>
    </div>
  );
}
