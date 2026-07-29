/**
 * Экраны практики — BRIEF.md §8 (m1-practice) и §12 (m2-practice), дословно.
 */
import type { PracticeCopy } from './types';

export const PRACTICE: Record<'m1-practice' | 'm2-practice', PracticeCopy> = {
  'm1-practice': {
    id: 'm1-practice',
    title: 'Теперь давай разберём реальный проект',
    sourceOptions: [
      { id: 'own', label: 'Мой проект' },
      { id: 'client', label: 'Проект клиента' },
      { id: 'demo', label: 'Демонстрационный пример' },
    ],
    steps: [
      'Открывает ассистента.',
      'Передаёт информацию.',
      'Отвечает на вопросы.',
      'Получает анализ.',
      'Выбирает самый полезный результат.',
    ],
    checkQuestion: 'Что оказалось полезнее всего?',
    checkOptions: [
      { id: 'jobs', label: 'Задачи аудитории' },
      { id: 'pains', label: 'Боли' },
      { id: 'fears', label: 'Страхи' },
      { id: 'segments', label: 'Сегменты' },
      { id: 'anti-personas', label: 'Антиперсоны' },
      { id: 'none', label: 'Пока ничего не понял' },
    ],
  },
  'm2-practice': {
    id: 'm2-practice',
    title: 'Что будем делать?',
    sourceOptions: [
      { id: 'direct', label: 'Объявления для Яндекс Директа' },
      { id: 'avito', label: 'Карточку Авито' },
      { id: 'target', label: 'Тексты для таргета' },
      { id: 'site', label: 'Офферы для сайта' },
      { id: 'creative', label: 'Идеи креативов' },
    ],
    steps: [
      'Копирует анализ ЦА.',
      'Передаёт ассистенту.',
      'Выбирает площадку.',
      'Получает несколько вариантов.',
      'Выбирает лучший.',
      'Отвечает, почему выбрал.',
    ],
    checkQuestion: 'Почему этот вариант сильнее?',
    checkOptions: [
      { id: 'situation', label: 'Попадает в конкретную ситуацию' },
      { id: 'result', label: 'Обещает понятный результат' },
      { id: 'fear', label: 'Снимает страх' },
      { id: 'differs', label: 'Отличается от конкурентов' },
      {
        id: 'sounds-nice',
        label: 'Просто красиво звучит',
        isWeak: true,
        reaction: 'Очень убедительный маркетинговый анализ. Попробуй ещё раз.',
      },
    ],
  },
};
