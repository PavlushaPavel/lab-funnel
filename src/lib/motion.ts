/**
 * Единственный источник пружин/длительностей анимации (DESIGN.md §7).
 * MOTION_INTENSITY: 4 — редакционный печатный мир не суетится: движение тише,
 * чем в снятых версиях, горизонтальных пролётов нет.
 * Никаких инлайновых магических чисел анимации вне этого файла.
 */
import { useReducedMotion } from 'motion/react';
import type { Transition, Variants } from 'motion/react';

export const springSnappy: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 }; // кнопки, чипы
export const springPanel: Transition = { type: 'spring', stiffness: 280, damping: 32, mass: 1.0 }; // панели, шторки
export const springSoft: Transition = { type: 'spring', stiffness: 180, damping: 26, mass: 1.1 }; // крупные счётчики
export const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]; // непружинные

/** Переход между экранами (§7): только opacity + короткий y 8px, без горизонтальных пролётов. */
export const screenVariants: Variants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0, transition: springPanel },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: easeOut } },
};

/** Контейнер списка: stagger 40ms между детьми. */
export const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

/** Элемент списка (§7): y 8px -> 0, opacity 0 -> 1, easeOut 260ms. */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: easeOut } },
};

/** Уважает prefers-reduced-motion. Компоненты обязаны спрашивать перед transform-анимацией. */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}

/**
 * Точечные длительности из DESIGN.md, которые не являются пружинами/вариантами,
 * но тоже не должны быть магическими числами внутри компонентов (ARCHITECTURE.md §11.3).
 * Доп. экспорт сверх контракта — не меняет и не убирает ничего из обязательного списка.
 */
export const durations = {
  press: 0.09, // нажатие кнопки, 90ms
  shake: 0.22, // тряска неверного ответа/кода, 220ms
  scanLine: 0.7, // скан-линия панели, 700ms
  codeCascade: 0.045, // каскадная вспышка слотов кода, stagger 45ms
  codeClear: 0.4, // автоочистка кода после ошибки, 400ms
  tickDraw: 0.4, // прорисовка TickRail на ключевых экранах, 400ms
} as const;
