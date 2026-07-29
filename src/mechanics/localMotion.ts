/**
 * Точечные длительности/пороги анимаций, специфичные для механик src/mechanics/*.
 * lib/motion.ts не трогаем (ARCHITECTURE.md §11.3 запрещает магические числа анимации
 * вне централизованного модуля) — но и плодить их по компонентам нельзя, поэтому
 * новые значения, которых нет в lib/motion.ts, собраны здесь, одним модулем на все механики.
 * Пружины и easing по-прежнему берутся только из lib/motion.ts (springSnappy/springPanel/
 * springSoft/easeOut) — здесь только длительности, задержки и доли/пороги.
 */

export const mechanicsDurations = {
  // BriefDecoder: пауза между "разломом" строки и появлением карточек-ситуаций
  decoderBreakGap: 0.16,
  // BriefDecoder: раскрытие деталей карточки (высота/прозрачность)
  decoderReveal: 0.22,

  // BullshitDetector: пауза перед появлением итогового разбора после последней найденной "воды"
  detectorBreakdownDelay: 0.3,

  // LeakScanner: длительность прохода скан-линии слева направо по 4 сегментам воронки
  leakScanTotal: 1.1,
  // LeakScanner: пауза перед появлением итоговой строки после скана
  leakResultDelay: 0.2,

  // FormulaForge: интервал между "напечатанными" фрагментами оффера
  forgePrintStep: 0.38,
  // FormulaForge: пауза перед голосованием после завершения печати оффера
  forgeVoteDelay: 0.25,

  // BeforeAfter: раскрытие пояснения маркера
  beforeAfterNoteReveal: 0.2,

  // ModuleChain: фазы кульминации — карточки съезжаются, коннекторы, сигнал, итог
  chainSlide: 0.5,
  chainConnectorDraw: 0.35,
  chainConnectorGap: 0.15,
  chainSignalTravel: 0.9,
  chainResultHold: 0.25,
} as const;

/** Пороги раскладки — не время, а доли/координаты, но тоже не должны быть магическими числами в JSX. */
export const mechanicsLayout = {
  // BeforeAfter: начальное положение шторки слайдера, % ширины трека
  sliderInitialSplit: 45,
} as const;
