/**
 * Реестр экранов волны C: фазы ВЕРЮ (модуль 3 + сборка цепочки) и ПЛАЧУ целиком.
 * ARCHITECTURE.md §2: router не трогаем — интеграционный агент подключает этот
 * реестр в src/router/registry.tsx вместе с реестрами других волн.
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

type RegistryCStep = Extract<
  StepId,
  | 'm3-intro'
  | 'm3-video'
  | 'm3-code'
  | 'm3-beforeafter'
  | 'chain'
  | 'final-video'
  | 'offer'
  | 'autoseller'
  | 'checkout'
>;

type Loader = () => Promise<{ default: ComponentType }>;

const loaders = {
  'm3-intro': () => import('./module3/M3IntroScreen').then((m) => ({ default: m.M3IntroScreen })),
  'm3-video': () => import('./module3/M3VideoScreen').then((m) => ({ default: m.M3VideoScreen })),
  'm3-code': () => import('./module3/M3CodeScreen').then((m) => ({ default: m.M3CodeScreen })),
  'm3-beforeafter': () =>
    import('./module3/M3BeforeAfterScreen').then((m) => ({ default: m.M3BeforeAfterScreen })),
  chain: () => import('./chain/ChainScreen').then((m) => ({ default: m.ChainScreen })),
  'final-video': () =>
    import('./chain/FinalVideoScreen').then((m) => ({ default: m.FinalVideoScreen })),
  offer: () => import('./offer/OfferScreen').then((m) => ({ default: m.OfferScreen })),
  autoseller: () =>
    import('./autoseller/AutoSellerScreen').then((m) => ({ default: m.AutoSellerScreen })),
  checkout: () => import('./offer/CheckoutScreen').then((m) => ({ default: m.CheckoutScreen })),
} satisfies Record<RegistryCStep, Loader>;

/** Компоненты для screenRegistry — обёрнуты в lazy() поверх тех же загрузчиков. */
export const registryC: Record<RegistryCStep, ComponentType> = Object.fromEntries(
  (Object.entries(loaders) as [RegistryCStep, Loader][]).map(([step, loader]) => [
    step,
    lazy(loader),
  ])
) as unknown as Record<RegistryCStep, ComponentType>;

/** Сырые загрузчики — для префетча следующего шага (App.tsx), без монтирования компонента. */
export const preloadersC: Record<RegistryCStep, Loader> = loaders;
