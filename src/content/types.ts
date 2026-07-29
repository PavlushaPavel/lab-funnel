/**
 * Типы контента — ARCHITECTURE.md §8, дословно + аддитивные расширения волны 2A.
 * Ноль импортов React. Только типы и структуры данных.
 *
 * Все новые поля — ТОЛЬКО опциональные добавления к зафиксированным контрактам.
 * Ни одно существующее обязательное поле не изменено и не удалено.
 */
import type { StepId, Spec, Tier, ModuleId } from '../store/funnel';

export interface ScreenCopy {
  id: StepId | string;
  label?: string; // моно-маркировка узла
  title: string;
  body?: string[]; // абзацы, ритм рубленых строк сохраняется
  bullets?: string[];
  quote?: string;
  cta: string; // текст первичной кнопки
  ctaSecondary?: string;

  // --- Расширения для экранов ввода кода (m1-code / m2-code / m3-code) ---
  codeWord?: string; // БРИФ / ФОРМУЛА / ENTER
  successTitle?: string; // текст при верном коде («Правильный ответ» из брифа)
  errorTitle?: string; // «Не угадал»
  errorBody?: string[]; // текст ошибки, абзацы
  caption?: string; // мелкая подпись под полем (у m3-code — «Тебе, если что.»)

  // --- Расширения для offer/checkout ---
  price?: number; // цена в рублях, где применимо (offer, checkout)
  bulletsSecondary?: string[]; // второй именованный список там, где в брифе их два (напр. offer «Формат:»)
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: { id: string; label: string }[];
  correctId: string;
  explain: string; // «Правильный ответ: …» из брифа
}

export interface ResultCopy {
  tier: Tier;
  title: string;
  body: string[];
  cta: string;
}

export interface SpecCopy {
  id: Spec;
  label: string;
  niche: string; // ниша-пример
  losing: string; // «где ты теряешь» под специализацию
  platforms: { id: string; label: string }[]; // варианты практики модуля 2
  usage: string[]; // применение анализа ЦА (видео 1, часть 6)
}

export interface AutoSellerBranch {
  id: string;
  question: string; // текст кнопки-возражения
  messages: string[]; // реплики автопродавца по очереди
  bullets?: string[];
  followUp: {
    id: string;
    label: string;
    action: 'checkout' | 'branch' | 'menu';
    // Для action:'branch' — id ветки из AUTOSELLER_BRANCHES, куда именно углубляться.
    // Без targetId (или если целевой ветки нет) экран корректно откатывается в меню —
    // это тоже допустимый исход, если в брифе углубляться действительно некуда.
    targetId?: string;
  }[];
}

/** Метаданные модуля-инвентаря (PRODUCT.md §3.3). */
export interface ModuleCopy {
  id: ModuleId;
  code: string; // «М-01»
  title: string; // «АУДИТОРИЯ» / «ОФФЕРЫ» / «СТРАНИЦА»
  codeWord: string; // БРИФ / ФОРМУЛА / ENTER
  outcome: string; // что человек теперь умеет — 1 фраза
  chainRole: string; // роль модуля в финальной цепочке (экран chain)
  /** Атомный номер клетки элемента: «01» / «02» / «03» (DESIGN.md §6.1). */
  number: string;
  /** Символ элемента — две кириллические буквы, как в таблице Менделеева. */
  symbol: string;
}

/** Один вариант ответа в практике, с флагом «слабого»/ретрай-варианта. */
export interface PracticeOption {
  id: string;
  label: string;
  isWeak?: boolean; // требует ретрая/спец-реакции
  reaction?: string; // спец-реплика при выборе (напр. m2-practice)
}

/** Данные экрана практики (m1-practice / m2-practice). */
export interface PracticeCopy {
  id: string; // StepId практики
  title: string;
  sourceOptions: { id: string; label: string }[]; // «Мой проект / Проект клиента / …» или площадки
  steps: string[]; // «Что делает пользователь» / «Действия», по порядку
  checkQuestion: string; // контрольный вопрос
  checkOptions: PracticeOption[];
}

/** Описательная часть видео (без техники плеера — та живёт в video.ts::VideoConfig). */
export interface VideoCopy {
  id: string;
  title: string; // рабочее название
  durationRange: string; // диапазон продолжительности из брифа, напр. «10–15 минут»
  description: string[]; // саммари содержания по абзацам
  keyword?: string; // ключевое слово кода, если видео с ним связано
}

/**
 * Копирайт экрана-моста между модулями (bridge-1 / bridge-2).
 * В брифе у таких экранов нет отдельного «Заголовка» — только «Текст» + «Кнопка».
 * Структурно это полноценный ScreenCopy, тип оставлен как алиас для смысловой ясности
 * в местах, где экран заведомо является мостом, а не обычным экраном.
 */
export type BridgeCopy = ScreenCopy;
