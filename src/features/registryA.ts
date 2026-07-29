/**
 * Реестр экранов волны A: фаза ЗНАЮ целиком + вход в фазу ХОЧУ (contract).
 * ARCHITECTURE.md §2: router не трогаем — интеграционный агент подключает этот
 * реестр в src/router/registry.tsx вместе с реестрами других волн.
 *
 * Типизирован точным подмножеством StepId (не Partial<Record<StepId, …>>) — это то, что
 * позволяет router/registry.tsx поймать пропущенный шаг на этапе компиляции, а не в рантайме.
 */
import type { ComponentType } from 'react';
import type { StepId } from '../store/funnel';
import { IntroScreen } from './intro/IntroScreen';
import { SpecScreen } from './spec/SpecScreen';
import { DiagIntroScreen } from './diagnostics/DiagIntroScreen';
import { QuizScreen } from './diagnostics/QuizScreen';
import { ResultScreen } from './diagnostics/ResultScreen';
import { ContractScreen } from './contract/ContractScreen';

type RegistryAStep = Extract<
  StepId,
  'intro' | 'spec' | 'diag-intro' | 'quiz' | 'result' | 'contract'
>;

export const registryA: Record<RegistryAStep, ComponentType> = {
  intro: IntroScreen,
  spec: SpecScreen,
  'diag-intro': DiagIntroScreen,
  quiz: QuizScreen,
  result: ResultScreen,
  contract: ContractScreen,
};
