/**
 * Реестр экранов: StepId -> компонент. Каждая волна фич поставляет свой частичный реестр
 * (registryA/B/C — features/registryA.ts и т.д.), здесь они сшиваются в один набор.
 *
 * Проверка полноты — на уровне типов, а не в рантайме: registryA/B/C типизированы точными
 * (непересекающимися) подмножествами StepId, а не Partial<Record<StepId, ComponentType>>.
 * Поэтому если какой-то StepId не попал ни в одну из волн, тип объединения ключей не
 * совпадёт с Record<StepId, ComponentType> и присваивание ниже не пройдёт tsc — сборка
 * упадёт на этапе компиляции с явным указанием, какого шага не хватает.
 *
 * Экраны — React.lazy: каждый компонент из screenRegistry сам по себе свой асинхронный чанк.
 * screenLoaders — та же карта, но сырыми функциями import() (без lazy()), нужна для префетча
 * следующего шага в простое (App.tsx): вызов лоадера прогревает кеш модуля браузера/сборщика,
 * а последующий React.lazy() на тот же импорт резолвится из этого кеша мгновенно, без спиннера.
 */
import type { ComponentType } from 'react';
import type { StepId } from '../store/funnel';
import { registryA, preloadersA } from '../features/registryA';
import { registryB, preloadersB } from '../features/registryB';
import { registryC, preloadersC } from '../features/registryC';

export const screenRegistry: Record<StepId, ComponentType> = {
  ...registryA,
  ...registryB,
  ...registryC,
};

/** Загрузчики чанков экранов (без монтирования) — источник для preloadStep. */
export const screenLoaders: Record<StepId, () => Promise<unknown>> = {
  ...preloadersA,
  ...preloadersB,
  ...preloadersC,
};

/**
 * Прогревает чанк шага заранее (App.tsx вызывает это для nextStep в простое браузера).
 * Ошибку сети на префетче намеренно глушим: это не пользовательское действие, а фоновая
 * оптимизация — если не получилось, обычный Suspense/fallback на реальном переходе
 * попробует загрузить чанк ещё раз.
 */
export function preloadStep(step: StepId): void {
  screenLoaders[step]?.().catch(() => {});
}
