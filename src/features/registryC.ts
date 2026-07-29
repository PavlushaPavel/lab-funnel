/**
 * Реестр экранов волны C: фазы ВЕРЮ (модуль 3 + сборка цепочки) и ПЛАЧУ целиком.
 * ARCHITECTURE.md §2: router не трогаем — интеграционный агент подключает этот
 * реестр в src/router/registry.tsx вместе с реестрами других волн.
 *
 * Типизирован точным подмножеством StepId (не Partial<Record<StepId, …>>) — это то, что
 * позволяет router/registry.tsx поймать пропущенный шаг на этапе компиляции, а не в рантайме.
 */
import type { ComponentType } from 'react';
import type { StepId } from '../store/funnel';
import { M3IntroScreen } from './module3/M3IntroScreen';
import { M3VideoScreen } from './module3/M3VideoScreen';
import { M3CodeScreen } from './module3/M3CodeScreen';
import { M3BeforeAfterScreen } from './module3/M3BeforeAfterScreen';
import { ChainScreen } from './chain/ChainScreen';
import { FinalVideoScreen } from './chain/FinalVideoScreen';
import { OfferScreen } from './offer/OfferScreen';
import { CheckoutScreen } from './offer/CheckoutScreen';
import { AutoSellerScreen } from './autoseller/AutoSellerScreen';

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

export const registryC: Record<RegistryCStep, ComponentType> = {
  'm3-intro': M3IntroScreen,
  'm3-video': M3VideoScreen,
  'm3-code': M3CodeScreen,
  'm3-beforeafter': M3BeforeAfterScreen,
  chain: ChainScreen,
  'final-video': FinalVideoScreen,
  offer: OfferScreen,
  autoseller: AutoSellerScreen,
  checkout: CheckoutScreen,
};
