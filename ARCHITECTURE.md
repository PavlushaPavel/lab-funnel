# ARCHITECTURE.md — контракты

> Обязательно к прочтению каждым агентом. Контракты зафиксированы оркестратором.
> **Менять сигнатуры нельзя** — на них параллельно опираются другие агенты.
> Если контракт мешает — не переписывай, сообщи в итоговом отчёте.

---

## 1. СТЕК

| Слой | Выбор | Примечание |
|---|---|---|
| Сборка | Vite 6 + React 19 + TypeScript (strict) | `npm create vite@latest . -- --template react-ts` |
| Стили | **Tailwind v4** через `@tailwindcss/vite` | НЕ через postcss-плагин `tailwindcss` |
| Анимация | `motion` → импорт из `motion/react` | не `framer-motion` |
| Состояние | `zustand` + `persist` (localStorage) | |
| Шрифты | `@fontsource-variable/onest`, `@fontsource-variable/jetbrains-mono` | self-hosted, без `<link>` |
| Иконки | `@phosphor-icons/react` | одна библиотека, `weight="regular"` |
| Telegram | собственная обёртка над `window.Telegram.WebApp` | без SDK-пакета, см. §4 |

`index.html` подключает `https://telegram.org/js/telegram-web-app.js` (единственный внешний скрипт — требование платформы).

Скрипты: `dev`, `build` (`tsc -b && vite build`), `preview`, `typecheck`, `lint`.
**`npm run build` обязан проходить без ошибок на каждом этапе.**

---

## 2. ДЕРЕВО ФАЙЛОВ

```
/workspace
  index.html  vite.config.ts  tsconfig*.json  package.json  .env.example
  DESIGN.md  PRODUCT.md  ARCHITECTURE.md  README.md
  src/
    main.tsx
    App.tsx                    # шелл: Grain + ProgressRail + роутер шагов + BottomBar
    styles/
      tokens.css               # ВСЕ CSS-переменные из DESIGN.md §3–§5
      globals.css              # reset, базовая типографика, @theme Tailwind v4, утилиты
    lib/
      telegram.ts              # обёртка WebApp + haptics + браузерный no-op
      analytics.ts             # track()
      motion.ts                # springSnappy/springPanel/springSoft/easeOut + варианты
      cn.ts                    # clsx-подобный склейщик классов (свой, 10 строк)
      format.ts                # formatRub(), plural()
    store/
      funnel.ts                # zustand-стор, см. §3
    router/
      flow.ts                  # STEPS, phaseOf(), nextStep(), prevStep(), progressOf()
    content/                   # ТОЛЬКО данные, ни одного JSX
      types.ts  specializations.ts  screens.ts  quiz.ts  results.ts
      modules.ts  practice.ts  autoseller.ts  mechanics.ts  video.ts
    ui/                        # примитивы, без бизнес-логики
      Screen.tsx  BottomBar.tsx  Button.tsx  Panel.tsx  NodeLabel.tsx
      Choice.tsx  ChoiceList.tsx  CodeInput.tsx  Readout.tsx  Well.tsx
      TickRail.tsx  ProgressRail.tsx  Grain.tsx  ScanLine.tsx
      Divider.tsx  Quote.tsx  Bullets.tsx  Chip.tsx  VideoBlock.tsx  Prose.tsx
      ModuleBadge.tsx           # статус модуля (заперт/проверяется/открыт), без химии
    mechanics/
      BullshitDetector.tsx  LeakScanner.tsx  BeforeAfter.tsx  TraceChain.tsx
      # BriefDecoder/FormulaForge/ModuleChain сняты вместе со снесёнными шагами m1-decoder/
      # m2-forge/chain — дублировали то, что человек уже видел в видео (см. §3 врезку)
    features/
      intro/  spec/  diagnostics/  contract/
      module1/  module2/  module3/  final/  offer/  autoseller/
      prefreim/                # отдельный лонгрид-маршрут
```

**Правила границ:**
- `content/*` — чистые данные и типы. **Ноль импортов React.**
- `ui/*` — презентационные примитивы. Не знают про стор и про контент.
- `mechanics/*` — интерактив, всё через пропсы + колбэк `onComplete`. Не читают стор напрямую.
- `features/*` — экраны: берут данные из `content`, состояние из `store`, рисуют через `ui` и `mechanics`.

---

## 3. КОНТРАКТ СОСТОЯНИЯ — `src/store/funnel.ts`

```ts
export type Spec = 'direct'|'avito'|'target'|'marketing'|'business'|'newbie'|'unknown';
export type Tier = 'low'|'mid'|'high';
export type ModuleId = 'm1'|'m2'|'m3';
export type Phase = 'know'|'want'|'believe'|'pay';

export type StepId =
  | 'intro'|'spec'|'diag-intro'|'quiz'|'result'
  | 'contract'
  | 'm1-intro'|'m1-video'|'m1-code'|'m1-detector'|'m1-practice'|'bridge-1'
  | 'm2-intro'|'m2-video'|'m2-code'|'m2-practice'|'bridge-2'
  | 'm3-intro'|'m3-video'|'m3-code'|'m3-beforeafter'
  | 'final-video'
  | 'offer'|'autoseller'|'checkout';

export interface FunnelState {
  step: StepId;
  history: StepId[];
  spec: Spec | null;
  quizIndex: number;                       // 0..5, текущий вопрос
  quizAnswers: Record<number, number>;     // индекс вопроса -> индекс варианта
  score: number;                           // 0..6
  tier: Tier | null;
  codes: Record<ModuleId, boolean>;        // код введён верно — открыт доступ к практике
  modules: Record<ModuleId, boolean>;      // практика реально выполнена — модуль засчитан
  videos: Record<string, number>;          // videoId -> доля просмотра 0..1
  mechanics: Record<string, boolean>;      // ключ механики -> завершена
  practice: Record<string, string>;        // id контрольного вопроса -> id ответа
  practiceInput: Record<string, string>;   // id практики -> реальный текст, вставленный человеком
  startedAt: number;

  // actions
  go(step: StepId): void;
  next(): void;
  back(): void;
  setSpec(s: Spec): void;
  setQuizIndex(i: number): void;           // текущий вопрос, зажимается в границы массива
  answerQuiz(qIndex: number, optIndex: number): void;
  finishQuiz(): void;                      // считает score, tier
  unlockCode(m: ModuleId): void;           // ставит ТОЛЬКО codes[m] — открывает доступ к практике
  completeModule(m: ModuleId): void;       // ставит modules[m] — только после реальной практики
  setVideoProgress(id: string, p: number): void;
  completeMechanic(key: string): void;
  setPractice(id: string, answer: string): void;
  setPracticeInput(id: string, value: string): void; // реальный текст практики, не чекбокс-театр
  reset(): void;
}
```

Селекторы (экспортировать из того же файла):
```ts
export const selectProgress: (s: FunnelState) => number;      // 0..1
export const selectPhase: (s: FunnelState) => Phase;
```

Персист: ключ `lab-funnel-v1`, версия `1`, сохраняются все поля кроме функций.

**Формула (реализовать буквально):**
```
tier:  score <= 2 -> 'low'   |  score <= 4 -> 'mid'   |  score >= 5 -> 'high'
```

**`codes` vs `modules` — не одно и то же (аудит продукта, снос ложного зачёта модуля):**
- `unlockCode(m)` вызывается на экране ввода кода (`m1-code`/`m2-code`/`m3-code`) сразу после
  верного слова. Ставит **только** `codes[m] = true`. Это открывает доступ к практике модуля —
  не более того.
- `completeModule(m)` вызывается **только** экраном реальной практики, после того как человек
  её выполнил: у `m1-practice`/`m2-practice` реальная работа — не чекбокс-чеклист «что делаешь
  по пути» (было театром, приложение не знало, сделал ли человек хоть что-то), а свободный
  текстовый ввод результата, полученного у ассистента (`setPracticeInput`, ≥15 символов не
  считая пробелов) плюс ответ на контрольный вопрос практики; `m3-beforeafter` — после
  завершения механики `BeforeAfter`. Ставит `modules[m] = true`.
- `practiceInput` персистится вместе с остальным прогрессом (см. `partialize`) — это то же
  доказательство работы, что и `practice`/`mechanics`, только произвольным текстом, а не id
  варианта.
- Раньше `unlockCode` ставил оба поля сразу — модуль засчитывался пройденным по факту
  угадывания кодового слова, до всякой практики. Это враньё о результате, поэтому сигнатуры
  разведены. `ProgressRail` (счётчик «N/3») и любой другой код, которому нужен факт «модуль
  реально пройден», обязаны читать `modules`, а не `codes`.

Ранее здесь была денежная «утечка» (`leakBase`, `LEAK_WEIGHTS`, `selectLeakCurrent`,
`selectLeakClosedPct`) — формула `SPEC_BASE[spec] * (1 + (6 - score) * 0.18)` была выдуманной,
подогнанной под цену продукта, и выдавала себя за доказательство. Снесена целиком вместе с
денежным счётчиком на экранах result/bridge-1/bridge-2/chain (аудит продукта). `chain` как шаг
и весь `store`-контракт этих полей не существуют.

---

## 4. КОНТРАКТ TELEGRAM — `src/lib/telegram.ts`

```ts
export interface Haptics {
  light(): void; medium(): void; heavy(): void;
  success(): void; error(): void; warning(): void; select(): void;
}
export const haptics: Haptics;                 // no-op вне Telegram, никогда не бросает

export function initTelegram(): void;          // expand(), ready(), disableVerticalSwipes(),
                                               // setHeaderColor('#08090B'), setBackgroundColor('#08090B')
export function setBackButton(visible: boolean, onClick?: () => void): void;
export function openLink(url: string): void;   // openLink / openTelegramLink по домену
export function closeApp(): void;
export function getUser(): { id?: number; firstName?: string; username?: string } | null;
export const isTelegram: boolean;
```

Все обращения к `window.Telegram?.WebApp` — только внутри этого файла, обёрнутые в try/catch.
Ни один другой файл не трогает `window.Telegram`.

---

## 5. КОНТРАКТ АНАЛИТИКИ — `src/lib/analytics.ts`

```ts
export type EventName =
  | 'prefreim_view'|'app_open'|'spec_select'|'quiz_start'|'quiz_answer'|'quiz_complete'
  | 'quiz_result'|'video_start'|'video_progress'|'video_complete'|'code_submit'
  | 'code_success'|'code_fail'|'assistant_open'|'practice_complete'|'mechanic_complete'
  | 'offer_view'|'autoseller_open'|'objection_select'
  | 'checkout_click'|'purchase_success';

export function track(event: EventName, payload?: Record<string, unknown>): void;
```
Автоматически добавляет `{ step, spec, tier, elapsedMs, tgUserId }`.
Отправка на `import.meta.env.VITE_ANALYTICS_URL` через `navigator.sendBeacon`, если задан;
иначе — буфер в `localStorage` + `console.debug`. **Никогда не бросает исключение.**

---

## 6. КОНТРАКТ ДВИЖЕНИЯ — `src/lib/motion.ts`

```ts
export const springSnappy: Transition;
export const springPanel: Transition;
export const springSoft: Transition;
export const easeOut: [number, number, number, number];
export const screenVariants: Variants;       // enter/center/exit, см. DESIGN.md §8
export const listStagger: Variants;          // container
export const listItem: Variants;             // item
export function useReducedMotionSafe(): boolean;
```
Каждый компонент с анимацией обязан уважать `useReducedMotionSafe()`.

---

## 7. КОНТРАКТ ПРИМИТИВОВ — `src/ui/*`

```tsx
// Screen.tsx — обёртка экрана: скролл-контейнер, gutters, анимация входа/выхода
<Screen id={StepId} label?="М-01 · АУДИТОРИЯ" phase?={Phase}>{children}</Screen>

// BottomBar.tsx — липкая нижняя панель с safe-area
<BottomBar hint?={string}><Button .../></BottomBar>

<Button variant="primary"|"secondary"|"ghost" size?="md"|"sm"
        onClick disabled? loading? icon?={ReactNode} full?={boolean}>Текст</Button>

<Panel label?={string} status?="locked"|"active"|"done"|"scanning">…</Panel>
<NodeLabel code="М-01" title="АУДИТОРИЯ" status?=… />

<Choice index={0} state="idle"|"selected"|"correct"|"wrong" onSelect={()=>{}}>Текст</Choice>
<ChoiceList options={{id,label}[]} value onChange revealCorrect?={string} />

<CodeInput length={4} onSubmit={(v:string)=>boolean} hint?={string} />
   // onSubmit возвращает true при верном коде; компонент сам играет success/error

<Readout value={number} suffix?="₽" size?="lg"|"sm" animate?={boolean} />
<Well>{children}</Well>
<TickRail progress={0..1} height?={number} />
<ProgressRail />                              // сам читает стор
<Grain />  <ScanLine trigger={boolean} />  <Divider />
<Quote>…</Quote>  <Bullets items={string[]} />  <Chip active?>…</Chip>
<Prose>…</Prose>                              // типографика длинного текста
<VideoBlock id={string} onProgress={(p:number)=>void} />
```

---

## 8. КОНТРАКТ КОНТЕНТА — `src/content/types.ts`

```ts
export interface ScreenCopy {
  id: StepId | string;
  label?: string;          // моно-маркировка узла
  title: string;
  body?: string[];         // абзацы, ритм рубленых строк сохраняется
  bullets?: string[];
  quote?: string;
  cta: string;             // текст первичной кнопки
  ctaSecondary?: string;
}
export interface QuizQuestion {
  id: number; question: string;
  options: { id: string; label: string }[];
  correctId: string; explain: string;   // «Правильный ответ: …» из брифа
}
export interface ResultCopy { tier: Tier; title: string; body: string[]; cta: string }
export interface SpecCopy {
  id: Spec; label: string; niche: string;      // ниша-пример
  losing: string;                              // «где ты теряешь» под специализацию
  platforms: { id: string; label: string }[];  // варианты практики модуля 2
  usage: string[];                             // применение анализа ЦА (видео 1, часть 6)
}
export interface AutoSellerBranch {
  id: string; question: string;                // текст кнопки-возражения
  messages: string[];                          // реплики автопродавца по очереди
  bullets?: string[];
  followUp: { id: string; label: string; action: 'checkout'|'branch'|'menu' }[];
}
```

Все тексты берутся из брифа **дословно**. Нигде не сокращать и не смягчать.

---

## 9. КОНТРАКТ МЕХАНИК — `src/mechanics/*`

Общая форма: каждая механика получает данные и сообщает о завершении.
```tsx
interface MechanicProps<T> { data: T; spec: Spec; onComplete: (result?: unknown) => void }
```
Механики **не** ходят в стор и **не** переключают шаг. Экран-владелец из `features/*`
вызывает `completeMechanic(key)` и `next()` в `onComplete`.

---

## 10. ОКРУЖЕНИЕ — `.env.example`

```
VITE_ANALYTICS_URL=
VITE_CHECKOUT_URL=
VITE_ASSISTANT_CA_URL=
VITE_ASSISTANT_ADS_URL=
VITE_SUPPORT_URL=
```
Отсутствие переменной = безопасная заглушка с видимым `TODO`, не падение.

---

## 11. ПРАВИЛА КАЧЕСТВА (проверяются оркестратором)

1. `npm run build` и `npm run typecheck` проходят чисто. `any` запрещён (кроме границы с `window.Telegram`).
2. Ни одного хардкодного цвета в JSX/CSS вне `tokens.css`. Только `var(--…)` / Tailwind-токены из `@theme`.
3. Ни одного магического числа анимации вне `lib/motion.ts`.
4. Ни одного `<div onClick>` — только нативные интерактивные элементы.
5. `prefers-reduced-motion` уважается везде.
6. Ни одного эмодзи в коде и в UI-тексте.
7. Русский текст без опечаток, буква «ё» сохраняется как в исходнике.
8. Ни одного `useState` для непрерывных значений (скролл, drag, счётчики) — только `useMotionValue`.
