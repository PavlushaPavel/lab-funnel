/**
 * Точечные длительности/пороги анимаций, специфичные для механик src/mechanics/*.
 * lib/motion.ts не трогаем (ARCHITECTURE.md §11.3 запрещает магические числа анимации
 * вне централизованного модуля) — но и плодить их по компонентам нельзя, поэтому
 * новые значения, которых нет в lib/motion.ts, собраны здесь, одним модулем на все механики.
 * Пружины и easing по-прежнему берутся только из lib/motion.ts (springSnappy/springPanel/
 * springSoft/easeOut) — здесь только длительности, задержки и доли/пороги.
 */

export const mechanicsDurations = {
  // BullshitDetector: пауза перед появлением итогового разбора после последней найденной "воды"
  detectorBreakdownDelay: 0.3,

  // LeakScanner: длительность прохода скан-линии слева направо по 4 сегментам воронки
  leakScanTotal: 1.1,
  // LeakScanner: пауза перед появлением итоговой строки после скана
  leakResultDelay: 0.2,

  // BeforeAfter: раскрытие пояснения маркера
  beforeAfterNoteReveal: 0.2,

  // TraceChain: пауза между появлением соседних ступеней цепочки
  traceChainStep: 0.5,
} as const;

/** Пороги раскладки — не время, а доли/координаты, но тоже не должны быть магическими числами в JSX. */
export const mechanicsLayout = {
  // BeforeAfter: начальное положение шторки слайдера, % ширины трека
  sliderInitialSplit: 45,
} as const;
