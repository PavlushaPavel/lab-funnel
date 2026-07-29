/**
 * Ниши-примеры — общий словарь подстановки для всех механик модуля 1/2/3 (PRODUCT.md §5).
 * ARCHITECTURE.md §2: content/* — чистые данные и типы, ноль импортов React.
 *
 * Вынесено из content/mechanics.ts в отдельный модуль намеренно: specializations.ts нужны
 * только эти две константы, а не весь файл данных механик (883 строки, тянется в лениво
 * загружаемые чанки механик). Если импортировать их из mechanics.ts, специализации —
 * которые нужны рано, ещё на фазе ЗНАЮ — утащили бы за собой данные всех шести механик
 * в стартовый чанк. Значения не менять — единственный источник правды по-прежнему один.
 */
import type { Spec } from '../store/funnel';

export type NicheId = 'ties' | 'dental' | 'ceilings';

/** Специализация пользователя -> ниша-пример для механик. Не 7 сценариев, а подстановка. */
export const NICHE_OF: Record<Spec, NicheId> = {
  direct: 'dental',
  avito: 'ceilings',
  target: 'ties',
  marketing: 'dental',
  business: 'ceilings',
  newbie: 'ties',
  unknown: 'ties',
};

export const NICHE_LABEL: Record<NicheId, string> = {
  ties: 'галстуки',
  dental: 'стоматология',
  ceilings: 'натяжные потолки',
};
