/** Форматирование чисел и валюты для показаний приборов. */

const NBSP = ' ';

/** 85000 -> «85 000» с неразрывными пробелами между разрядами (без знака валюты). */
export function formatThousands(n: number): string {
  const rounded = Math.round(n);
  const withSpaces = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${withSpaces}`;
}

/** 85000 -> «85 000 ₽» с неразрывными пробелами между разрядами и перед знаком валюты. */
export function formatRub(n: number): string {
  return `${formatThousands(n)}${NBSP}₽`;
}

/**
 * Склонение существительного по числу: forms = [1 вопрос, 2 вопроса, 5 вопросов].
 * plural(1, ['вопрос','вопроса','вопросов']) -> 'вопрос'
 */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}
