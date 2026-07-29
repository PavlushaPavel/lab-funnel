/**
 * Центральный стор воронки. ARCHITECTURE.md §3 — сигнатуры и формулы неизменны.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nextStep, prevStep, progressOf, phaseOf } from '../router/flow';
import { QUIZ_QUESTIONS } from '../content/quiz';

export type Spec = 'direct' | 'avito' | 'target' | 'marketing' | 'business' | 'newbie' | 'unknown';
export type Tier = 'low' | 'mid' | 'high';
export type ModuleId = 'm1' | 'm2' | 'm3';
export type Phase = 'know' | 'want' | 'believe' | 'pay';

export type StepId =
  | 'intro'
  | 'spec'
  | 'diag-intro'
  | 'quiz'
  | 'result'
  | 'contract'
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
  | 'm3-intro'
  | 'm3-video'
  | 'm3-code'
  | 'm3-beforeafter'
  | 'chain'
  | 'final-video'
  | 'offer'
  | 'autoseller'
  | 'checkout';

export interface FunnelState {
  step: StepId;
  history: StepId[];
  spec: Spec | null;
  quizIndex: number; // 0..5, текущий вопрос
  quizAnswers: Record<number, number>; // индекс вопроса -> индекс варианта
  score: number; // 0..6
  tier: Tier | null;
  codes: Record<ModuleId, boolean>;
  modules: Record<ModuleId, boolean>;
  videos: Record<string, number>; // videoId -> доля просмотра 0..1
  mechanics: Record<string, boolean>; // ключ механики -> завершена
  practice: Record<string, string>; // id контрольного вопроса -> id ответа
  leakBase: number; // ₽/мес, 0 пока нет результата
  startedAt: number;

  // actions
  go(step: StepId): void;
  next(): void;
  back(): void;
  setSpec(s: Spec): void;
  /** Текущий вопрос теста. Значение зажимается в границы массива вопросов. */
  setQuizIndex(i: number): void;
  answerQuiz(qIndex: number, optIndex: number): void;
  finishQuiz(): void; // считает score, tier, leakBase
  unlockCode(m: ModuleId): void;
  setVideoProgress(id: string, p: number): void;
  completeMechanic(key: string): void;
  setPractice(id: string, answer: string): void;
  reset(): void;
}

/** Базы утечки ₽/мес по специализации (PRODUCT.md §3.1). */
const SPEC_BASE: Record<Spec, number> = {
  direct: 85000,
  avito: 60000,
  target: 75000,
  marketing: 110000,
  business: 140000,
  newbie: 40000,
  unknown: 70000,
};

/**
 * Доля утечки, которую закрывает каждый модуль (PRODUCT.md §3.1).
 * Экспортирована — это единственный источник весов; экраны (напр. мосты между модулями),
 * которым нужно восстановить «прошлое» значение утечки, обязаны импортировать её отсюда,
 * а не заводить локальную копию числа.
 */
export const LEAK_WEIGHTS: Record<ModuleId, number> = { m1: 0.28, m2: 0.22, m3: 0.34 };

const MODULE_IDS: ModuleId[] = ['m1', 'm2', 'm3'];

function initialState(): Omit<
  FunnelState,
  | 'go'
  | 'next'
  | 'back'
  | 'setSpec'
  | 'setQuizIndex'
  | 'answerQuiz'
  | 'finishQuiz'
  | 'unlockCode'
  | 'setVideoProgress'
  | 'completeMechanic'
  | 'setPractice'
  | 'reset'
> {
  return {
    step: 'intro',
    history: [],
    spec: null,
    quizIndex: 0,
    quizAnswers: {},
    score: 0,
    tier: null,
    codes: { m1: false, m2: false, m3: false },
    modules: { m1: false, m2: false, m3: false },
    videos: {},
    mechanics: {},
    practice: {},
    leakBase: 0,
    startedAt: Date.now(),
  };
}

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      go: (step) =>
        set((s) => ({
          history: [...s.history, s.step],
          step,
        })),

      next: () => {
        const n = nextStep(get().step);
        if (n) get().go(n);
      },

      back: () => {
        const s = get();
        if (s.history.length > 0) {
          const h = [...s.history];
          const prev = h.pop() as StepId;
          set({ step: prev, history: h });
          return;
        }
        const p = prevStep(s.step);
        if (p) set({ step: p });
      },

      setSpec: (spec) => set({ spec }),

      setQuizIndex: (i) =>
        set({ quizIndex: Math.min(Math.max(i, 0), QUIZ_QUESTIONS.length - 1) }),

      answerQuiz: (qIndex, optIndex) =>
        set((s) => ({
          quizAnswers: { ...s.quizAnswers, [qIndex]: optIndex },
        })),

      finishQuiz: () =>
        set((s) => {
          let score = 0;
          for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
            const q = QUIZ_QUESTIONS[i];
            const answerIdx = s.quizAnswers[i];
            if (q && answerIdx !== undefined && q.options[answerIdx]?.id === q.correctId) {
              score++;
            }
          }
          const tier: Tier = score <= 2 ? 'low' : score <= 4 ? 'mid' : 'high';
          const spec = s.spec ?? 'unknown';
          const leakBase = Math.round((SPEC_BASE[spec] * (1 + (6 - score) * 0.18)) / 1000) * 1000;
          return { score, tier, leakBase };
        }),

      unlockCode: (m) =>
        set((s) => ({
          codes: { ...s.codes, [m]: true },
          modules: { ...s.modules, [m]: true },
        })),

      setVideoProgress: (id, p) =>
        set((s) => ({
          videos: { ...s.videos, [id]: Math.max(0, Math.min(1, p)) },
        })),

      completeMechanic: (key) =>
        set((s) => ({
          mechanics: { ...s.mechanics, [key]: true },
        })),

      setPractice: (id, answer) =>
        set((s) => ({
          practice: { ...s.practice, [id]: answer },
        })),

      reset: () => set({ ...initialState() }),
    }),
    {
      name: 'lab-funnel-v1',
      version: 1,
      // персистим только данные, экшены (функции) в сериализацию не попадают
      partialize: (s) => {
        const { step, history, spec, quizIndex, quizAnswers, score, tier, codes, modules, videos, mechanics, practice, leakBase, startedAt } = s;
        return { step, history, spec, quizIndex, quizAnswers, score, tier, codes, modules, videos, mechanics, practice, leakBase, startedAt };
      },
    }
  )
);

// ---- Селекторы ----

/** Утечка сейчас — с учётом закрытых (разблокированных) модулей. */
export const selectLeakCurrent = (s: FunnelState): number => {
  const closed = MODULE_IDS.reduce((sum, m) => sum + (s.modules[m] ? LEAK_WEIGHTS[m] : 0), 0);
  return Math.round(s.leakBase * (1 - closed));
};

/** Процент утечки, закрытый разблокированными модулями (0..100). */
export const selectLeakClosedPct = (s: FunnelState): number => {
  const closed = MODULE_IDS.reduce((sum, m) => sum + (s.modules[m] ? LEAK_WEIGHTS[m] : 0), 0);
  return Math.round(closed * 100);
};

/** Прогресс калибровки 0..1 по позиции текущего шага в маршруте. */
export const selectProgress = (s: FunnelState): number => progressOf(s.step);

/** Текущая фаза воронки. */
export const selectPhase = (s: FunnelState): Phase => phaseOf(s.step);
