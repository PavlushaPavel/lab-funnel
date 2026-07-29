/**
 * Реестр экранов волны A: фаза ЗНАЮ целиком + вход в фазу ХОЧУ (contract).
 * ARCHITECTURE.md §2: router не трогаем — интеграционный агент подключает этот
 * реестр в src/router/registry.tsx вместе с реестрами других волн.
 *
 * Типизирован точным подмножеством StepId (не Partial<Record<StepId, …>>) — это то, что
 * позволяет router/registry.tsx поймать пропущенный шаг на этапе компиляции, а не в рантайме.
 *
 * Экраны грузятся лениво (React.lazy): каждый — свой асинхронный чанк, скачивается только
 * когда до него реально доходит воронка (или префетчится заранее — App.tsx, router/flow.ts).
 * Полнота проверяется на уровне `loaders` через `satisfies` — тот же эффект, что раньше давала
 * прямая аннотация типа на объекте компонентов: пропущенный или лишний StepId роняет tsc.
 */
import { lazy } from 'react';
import type { ComponentType } from 'react';
import type { StepId } from '../store/funnel';

type RegistryAStep = Extract<
  StepId,
  'intro' | 'spec' | 'diag-intro' | 'quiz' | 'result' | 'contract'
>;

type Loader = () => Promise<{ default: ComponentType }>;

const loaders = {
  intro: () => import('./intro/IntroScreen').then((m) => ({ default: m.IntroScreen })),
  spec: () => import('./spec/SpecScreen').then((m) => ({ default: m.SpecScreen })),
  'diag-intro': () =>
    import('./diagnostics/DiagIntroScreen').then((m) => ({ default: m.DiagIntroScreen })),
  quiz: () => import('./diagnostics/QuizScreen').then((m) => ({ default: m.QuizScreen })),
  result: () => import('./diagnostics/ResultScreen').then((m) => ({ default: m.ResultScreen })),
  contract: () => import('./contract/ContractScreen').then((m) => ({ default: m.ContractScreen })),
} satisfies Record<RegistryAStep, Loader>;

/** Компоненты для screenRegistry — обёрнуты в lazy() поверх тех же загрузчиков. */
export const registryA: Record<RegistryAStep, ComponentType> = Object.fromEntries(
  (Object.entries(loaders) as [RegistryAStep, Loader][]).map(([step, loader]) => [
    step,
    lazy(loader),
  ])
) as unknown as Record<RegistryAStep, ComponentType>;

/** Сырые загрузчики — для префетча следующего шага (App.tsx), без монтирования компонента. */
export const preloadersA: Record<RegistryAStep, Loader> = loaders;
