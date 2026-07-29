/**
 * Карта маршрута воронки. Порядок шагов — PRODUCT.md §6.
 * Здесь же — переходы между шагами и расчёт прогресса/фазы.
 * StepId/Phase — типы стора, импортируются только как типы (без рантайм-цикла).
 */
import type { StepId, Phase } from '../store/funnel';

/** Линейный порядок экранов воронки (без prefreim — это отдельный вне-потоковый маршрут). */
export const STEPS: StepId[] = [
  // ФАЗА ЗНАЮ
  'intro',
  'spec',
  'diag-intro',
  'quiz',
  'result',
  // ФАЗА ХОЧУ
  'contract',
  'm1-intro',
  'm1-video',
  'm1-code',
  'm1-detector',
  'm1-practice',
  'bridge-1',
  'm2-intro',
  'm2-video',
  'm2-code',
  'm2-practice',
  'bridge-2',
  // ФАЗА ВЕРЮ
  'm3-intro',
  'm3-video',
  'm3-code',
  'm3-beforeafter',
  'final-video',
  // ФАЗА ПЛАЧУ
  'offer',
  'autoseller',
  'checkout',
];

/** Карта шаг -> фаза воронки «ЗНАЮ · ХОЧУ · ВЕРЮ · ПЛАЧУ». */
export const STEP_PHASE: Record<StepId, Phase> = {
  intro: 'know',
  spec: 'know',
  'diag-intro': 'know',
  quiz: 'know',
  result: 'know',

  contract: 'want',
  'm1-intro': 'want',
  'm1-video': 'want',
  'm1-code': 'want',
  'm1-detector': 'want',
  'm1-practice': 'want',
  'bridge-1': 'want',
  'm2-intro': 'want',
  'm2-video': 'want',
  'm2-code': 'want',
  'm2-practice': 'want',
  'bridge-2': 'want',

  'm3-intro': 'believe',
  'm3-video': 'believe',
  'm3-code': 'believe',
  'm3-beforeafter': 'believe',
  'final-video': 'believe',

  offer: 'pay',
  autoseller: 'pay',
  checkout: 'pay',
};

export function phaseOf(step: StepId): Phase {
  return STEP_PHASE[step];
}

export function nextStep(step: StepId): StepId | null {
  const idx = STEPS.indexOf(step);
  if (idx === -1 || idx === STEPS.length - 1) return null;
  return STEPS[idx + 1];
}

export function prevStep(step: StepId): StepId | null {
  const idx = STEPS.indexOf(step);
  if (idx <= 0) return null;
  return STEPS[idx - 1];
}

/** Прогресс калибровки 0..1: 0 на первом шаге, 1 на последнем. */
export function progressOf(step: StepId): number {
  const idx = STEPS.indexOf(step);
  if (idx === -1) return 0;
  return idx / (STEPS.length - 1);
}
