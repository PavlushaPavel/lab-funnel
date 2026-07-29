/**
 * Реестр экранов: StepId -> компонент. Каждая волна фич поставляет свой частичный реестр
 * (registryA/B/C — features/registryA.ts и т.д.), здесь они сшиваются в один набор.
 *
 * Проверка полноты — на уровне типов, а не в рантайме: registryA/B/C типизированы точными
 * (непересекающимися) подмножествами StepId, а не Partial<Record<StepId, ComponentType>>.
 * Поэтому если какой-то StepId не попал ни в одну из волн, тип объединения ключей не
 * совпадёт с Record<StepId, ComponentType> и присваивание ниже не пройдёт tsc — сборка
 * упадёт на этапе компиляции с явным указанием, какого шага не хватает.
 */
import type { ComponentType } from 'react';
import type { StepId } from '../store/funnel';
import { registryA } from '../features/registryA';
import { registryB } from '../features/registryB';
import { registryC } from '../features/registryC';

export const screenRegistry: Record<StepId, ComponentType> = {
  ...registryA,
  ...registryB,
  ...registryC,
};
