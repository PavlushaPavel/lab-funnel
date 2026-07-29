/**
 * Центральный стор воронки. ARCHITECTURE.md §3 — сигнатуры неизменны.
 * Денежная «утечка» (leakBase/LEAK_WEIGHTS/selectLeak*) удалена как выдуманная экономика,
 * подогнанная под цену продукта (аудит продукта, снос слоя геймификации) — см. отчёт волны сноса.
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
  | 'm1-detector'
  | 'm1-practice'
  | 'bridge-1'
  | 'm2-intro'
  | 'm2-video'
  | 'm2-code'
  | 'm2-practice'
  | 'bridge-2'
  | 'm3-intro'
  | 'm3-video'
  | 'm3-code'
  | 'm3-beforeafter'
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
  practiceInput: Record<string, string>; // id практики -> реальный текст, вставленный человеком
  startedAt: number;

  // actions
  go(step: StepId): void;
  next(): void;
  back(): void;
  setSpec(s: Spec): void;
  /** Текущий вопрос теста. Значение зажимается в границы массива вопросов. */
  setQuizIndex(i: number): void;
  answerQuiz(qIndex: number, optIndex: number): void;
  finishQuiz(): void; // считает score, tier
  /** Верный код открывает доступ к практике модуля. НЕ засчитывает модуль пройденным. */
  unlockCode(m: ModuleId): void;
  /** Модуль засчитан пройденным — только после реальной практики (ARCHITECTURE.md §3). */
  completeModule(m: ModuleId): void;
  setVideoProgress(id: string, p: number): void;
  completeMechanic(key: string): void;
  setPractice(id: string, answer: string): void;
  /** Реальный ввод человека (результат работы с ассистентом) — не чекбокс, а факт (PRODUCT.md §3.4). */
  setPracticeInput(id: string, value: string): void;
  reset(): void;
}

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
  | 'completeModule'
  | 'setVideoProgress'
  | 'completeMechanic'
  | 'setPractice'
  | 'setPracticeInput'
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
    practiceInput: {},
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
          return { score, tier };
        }),

      // Код открывает доступ к практике модуля. Модуль ещё не пройден — это враньё о
      // результате: человек только что посмотрел видео и угадал слово, а не сделал работу.
      unlockCode: (m) =>
        set((s) => ({
          codes: { ...s.codes, [m]: true },
        })),

      // Вызывается только после реальной практики (ассистент + контрольный вопрос у m1/m2,
      // механика BeforeAfter у m3) — ARCHITECTURE.md §3.
      completeModule: (m) =>
        set((s) => ({
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

      setPracticeInput: (id, value) =>
        set((s) => ({
          practiceInput: { ...s.practiceInput, [id]: value },
        })),

      reset: () => set({ ...initialState() }),
    }),
    {
      name: 'lab-funnel-v1',
      version: 1,
      // персистим только данные, экшены (функции) в сериализацию не попадают
      partialize: (s) => {
        const { step, history, spec, quizIndex, quizAnswers, score, tier, codes, modules, videos, mechanics, practice, practiceInput, startedAt } = s;
        return { step, history, spec, quizIndex, quizAnswers, score, tier, codes, modules, videos, mechanics, practice, practiceInput, startedAt };
      },
    }
  )
);

// ---- Селекторы ----

/** Прогресс калибровки 0..1 по позиции текущего шага в маршруте. */
export const selectProgress = (s: FunnelState): number => progressOf(s.step);

/** Текущая фаза воронки. */
export const selectPhase = (s: FunnelState): Phase => phaseOf(s.step);
