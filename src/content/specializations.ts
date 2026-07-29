/**
 * Персонализация по специализации — PRODUCT.md §5, BRIEF.md §2 и §6 (часть 6).
 * Один сценарий, меняются только: label (дословно из брифа), ниша-пример,
 * формулировка «где теряешь», порядок площадок практики модуля 2 и применение анализа ЦА.
 *
 * label — дословно из BRIEF.md §2.
 * usage — дословные формулировки из BRIEF.md §6 «Часть 6. Где это использовать»
 * (разделы «Директологу / Авитологу / Таргетологу / Маркетологу»). Для business/newbie/unknown
 * в брифе отдельных разделов нет — набор собран из тех же формулировок (см. итоговый отчёт).
 * niche и losing — авторские, brief их не даёт (см. итоговый отчёт).
 *
 * SPEC_BASE (базы утечки ₽/мес) уже определены в src/store/funnel.ts — не дублируются здесь.
 */
import type { SpecCopy } from './types';
import type { Spec } from '../store/funnel';
import { NICHE_OF, NICHE_LABEL } from './mechanics';

/**
 * Ниша-пример выводится из NICHE_OF (src/content/mechanics.ts) — единый источник правды.
 * Механики умеют ровно три набора данных (галстуки / стоматология / натяжные потолки),
 * поэтому подпись ниши на экранах обязана совпадать с тем, что реально подставит механика.
 * Не хардкодить строку здесь: разъедется с механикой и пользователь увидит несостыковку.
 */
const nicheFor = (s: Spec): string => NICHE_LABEL[NICHE_OF[s]];

// Базовый набор площадок практики модуля 2 — BRIEF.md §12, порядок как в брифе.
const PLATFORM_DIRECT = { id: 'direct', label: 'Объявления для Яндекс Директа' };
const PLATFORM_AVITO = { id: 'avito', label: 'Карточку Авито' };
const PLATFORM_TARGET = { id: 'target', label: 'Тексты для таргета' };
const PLATFORM_SITE = { id: 'site', label: 'Офферы для сайта' };
const PLATFORM_CREATIVE = { id: 'creative', label: 'Идеи креативов' };

// Формулировки применения анализа ЦА — BRIEF.md §6, часть 6, дословно по ролям.
const USAGE_DIRECTOLOGU = [
  'расширить семантику',
  'найти ситуационные запросы',
  'разбить кампании по мотивам',
  'сделать разные объявления',
  'проверить посадочную',
];
const USAGE_AVITOLOGU = [
  'написать разные заголовки',
  'изменить первые строки',
  'подобрать аргументы',
  'придумать визуалы',
  'собрать отдельные объявления под разные ситуации',
];
const USAGE_TARGETOLOGU = [
  'сформировать сегменты',
  'придумать разные креативные углы',
  'собрать холодные сообщения',
  'сделать ретаргетинг под страхи и барьеры',
];
const USAGE_MARKETOLOGU = [
  'проверить позиционирование',
  'найти неохваченные сегменты',
  'усилить оффер',
  'предложить клиенту новые направления',
];

export const SPECIALIZATIONS: Record<Spec, SpecCopy> = {
  direct: {
    id: 'direct',
    label: 'Яндекс Директ',
    niche: nicheFor('direct'),
    losing: 'Ты сливаешь бюджет в клики, потому что не понимаешь, кто на самом деле в объявление кликает и зачем.',
    platforms: [PLATFORM_DIRECT, PLATFORM_SITE, PLATFORM_TARGET, PLATFORM_AVITO, PLATFORM_CREATIVE],
    usage: USAGE_DIRECTOLOGU,
  },
  avito: {
    id: 'avito',
    label: 'Авито',
    niche: nicheFor('avito'),
    losing: 'Ты долбишь одно и то же объявление на всех, а разные покупатели читают его так, будто оно не про них.',
    platforms: [PLATFORM_AVITO, PLATFORM_SITE, PLATFORM_CREATIVE, PLATFORM_TARGET, PLATFORM_DIRECT],
    usage: USAGE_AVITOLOGU,
  },
  target: {
    id: 'target',
    label: 'Таргетированная реклама',
    niche: nicheFor('target'),
    losing: 'Крутишь один и тот же креатив на холодную аудиторию и удивляешься, что она не покупает с первого показа.',
    platforms: [PLATFORM_TARGET, PLATFORM_CREATIVE, PLATFORM_SITE, PLATFORM_DIRECT, PLATFORM_AVITO],
    usage: USAGE_TARGETOLOGU,
  },
  marketing: {
    id: 'marketing',
    label: 'Маркетингом в целом',
    niche: nicheFor('marketing'),
    losing: 'Строишь стратегию на демографии, а не на реальных ситуациях людей — и она разваливается на первом же тесте.',
    platforms: [PLATFORM_SITE, PLATFORM_DIRECT, PLATFORM_TARGET, PLATFORM_AVITO, PLATFORM_CREATIVE],
    usage: USAGE_MARKETOLOGU,
  },
  business: {
    id: 'business',
    label: 'Свой бизнес',
    niche: nicheFor('business'),
    losing: 'Платишь за рекламу и дизайнеров, а сам толком не знаешь, кому и что на самом деле продаёшь.',
    platforms: [PLATFORM_SITE, PLATFORM_DIRECT, PLATFORM_AVITO, PLATFORM_TARGET, PLATFORM_CREATIVE],
    // В брифе нет отдельного раздела «Владельцу бизнеса» для части 6 — набор собран из смежных
    // формулировок (маркетолог + директолог), см. итоговый отчёт.
    usage: ['проверить позиционирование', 'усилить оффер', 'проверить посадочную', 'найти неохваченные сегменты'],
  },
  newbie: {
    id: 'newbie',
    label: 'Только начинаю',
    niche: nicheFor('newbie'),
    losing: 'Пока даже не понимаешь, где именно теряются деньги. А они уже теряются.',
    platforms: [PLATFORM_SITE, PLATFORM_DIRECT, PLATFORM_AVITO, PLATFORM_TARGET, PLATFORM_CREATIVE],
    // Раздела «Новичку» в части 6 брифа нет — набор собран из смежных формулировок, разжёвано (PRODUCT.md §5).
    usage: ['расширить семантику', 'сформировать сегменты', 'усилить оффер', 'проверить посадочную'],
  },
  unknown: {
    id: 'unknown',
    label: 'Пока сам не понял',
    niche: nicheFor('unknown'),
    losing: 'Непонятно, что именно ты делаешь, но бабки утекают одинаково исправно.',
    platforms: [PLATFORM_DIRECT, PLATFORM_AVITO, PLATFORM_TARGET, PLATFORM_SITE, PLATFORM_CREATIVE],
    // Раздела для этой специализации в части 6 брифа нет — набор собран из смежных формулировок, разжёвано (PRODUCT.md §5).
    usage: ['проверить позиционирование', 'сформировать сегменты', 'усилить оффер', 'проверить посадочную'],
  },
};
