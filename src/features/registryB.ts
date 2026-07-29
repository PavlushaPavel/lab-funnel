/**
 * Экраны модулей 1 и 2 (фаза ХОЧУ) — ARCHITECTURE.md §2. Интеграционный агент подключает
 * эту карту в router/registry.tsx (сам registry.tsx эта волна не трогает).
 *
 * Типизирован точным подмножеством StepId (не Partial<Record<StepId, …>>) — это то, что
 * позволяет router/registry.tsx поймать пропущенный шаг на этапе компиляции, а не в рантайме.
 *
 * Экраны грузятся лениво (React.lazy) — см. комментарий в registryA.ts о том, как здесь
 * сохранена проверка полноты компилятором (через `satisfies` на объекте загрузчиков).
 */
import { lazy } from 'react';
import type { ComponentType } from 'react';
import type { StepId } from '../store/funnel';

type RegistryBStep = Extract<
  StepId,
  | 'm1-intro'
  | 'm1-video'
  | 'm1-code'
  | 'm1-decoder'
  | 'm1-detector'
  | 'm1-practice'
  | 'bridge-1'
  | 'm2-intro'
  | 'm2-video'
  | 'm2-code'
  | 'm2-forge'
  | 'm2-practice'
  | 'bridge-2'
>;

type Loader = () => Promise<{ default: ComponentType }>;

const loaders = {
  'm1-intro': () => import('./module1/M1IntroScreen').then((m) => ({ default: m.M1IntroScreen })),
  'm1-video': () => import('./module1/M1VideoScreen').then((m) => ({ default: m.M1VideoScreen })),
  'm1-code': () => import('./module1/M1CodeScreen').then((m) => ({ default: m.M1CodeScreen })),
  'm1-decoder': () =>
    import('./module1/M1DecoderScreen').then((m) => ({ default: m.M1DecoderScreen })),
  'm1-detector': () =>
    import('./module1/M1DetectorScreen').then((m) => ({ default: m.M1DetectorScreen })),
  'm1-practice': () =>
    import('./module1/M1PracticeScreen').then((m) => ({ default: m.M1PracticeScreen })),
  'bridge-1': () => import('./module1/Bridge1Screen').then((m) => ({ default: m.Bridge1Screen })),
  'm2-intro': () => import('./module2/M2IntroScreen').then((m) => ({ default: m.M2IntroScreen })),
  'm2-video': () => import('./module2/M2VideoScreen').then((m) => ({ default: m.M2VideoScreen })),
  'm2-code': () => import('./module2/M2CodeScreen').then((m) => ({ default: m.M2CodeScreen })),
  'm2-forge': () => import('./module2/M2ForgeScreen').then((m) => ({ default: m.M2ForgeScreen })),
  'm2-practice': () =>
    import('./module2/M2PracticeScreen').then((m) => ({ default: m.M2PracticeScreen })),
  'bridge-2': () => import('./module2/Bridge2Screen').then((m) => ({ default: m.Bridge2Screen })),
} satisfies Record<RegistryBStep, Loader>;

/** Компоненты для screenRegistry — обёрнуты в lazy() поверх тех же загрузчиков. */
export const registryB: Record<RegistryBStep, ComponentType> = Object.fromEntries(
  (Object.entries(loaders) as [RegistryBStep, Loader][]).map(([step, loader]) => [
    step,
    lazy(loader),
  ])
) as unknown as Record<RegistryBStep, ComponentType>;

/** Сырые загрузчики — для префетча следующего шага (App.tsx), без монтирования компонента. */
export const preloadersB: Record<RegistryBStep, Loader> = loaders;
