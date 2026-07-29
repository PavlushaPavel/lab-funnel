/**
 * Экраны модулей 1 и 2 (фаза ХОЧУ) — ARCHITECTURE.md §2. Интеграционный агент подключает
 * эту карту в router/registry.tsx (сам registry.tsx эта волна не трогает).
 *
 * Типизирован точным подмножеством StepId (не Partial<Record<StepId, …>>) — это то, что
 * позволяет router/registry.tsx поймать пропущенный шаг на этапе компиляции, а не в рантайме.
 */
import type { ComponentType } from 'react';
import type { StepId } from '../store/funnel';
import { M1IntroScreen } from './module1/M1IntroScreen';
import { M1VideoScreen } from './module1/M1VideoScreen';
import { M1CodeScreen } from './module1/M1CodeScreen';
import { M1DecoderScreen } from './module1/M1DecoderScreen';
import { M1DetectorScreen } from './module1/M1DetectorScreen';
import { M1PracticeScreen } from './module1/M1PracticeScreen';
import { Bridge1Screen } from './module1/Bridge1Screen';
import { M2IntroScreen } from './module2/M2IntroScreen';
import { M2VideoScreen } from './module2/M2VideoScreen';
import { M2CodeScreen } from './module2/M2CodeScreen';
import { M2ForgeScreen } from './module2/M2ForgeScreen';
import { M2PracticeScreen } from './module2/M2PracticeScreen';
import { Bridge2Screen } from './module2/Bridge2Screen';

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

export const registryB: Record<RegistryBStep, ComponentType> = {
  'm1-intro': M1IntroScreen,
  'm1-video': M1VideoScreen,
  'm1-code': M1CodeScreen,
  'm1-decoder': M1DecoderScreen,
  'm1-detector': M1DetectorScreen,
  'm1-practice': M1PracticeScreen,
  'bridge-1': Bridge1Screen,
  'm2-intro': M2IntroScreen,
  'm2-video': M2VideoScreen,
  'm2-code': M2CodeScreen,
  'm2-forge': M2ForgeScreen,
  'm2-practice': M2PracticeScreen,
  'bridge-2': Bridge2Screen,
};
