/**
 * Вне-потоковый маршрут лонгрида-префрейма (PRODUCT.md §6, ARCHITECTURE.md §2).
 * Один HTML-вход (index.html) на весь проект — что рисовать корнем (App или PrefreimScreen),
 * решается в src/main.tsx по наличию сегмента "prefreim" в пути.
 *
 * Сравниваем по ВХОЖДЕНИЮ сегмента, а не строгому равенству pathname: vite.config.ts задаёт
 * base:'./', на GitHub Pages приложение живёт в подкаталоге репозитория (например
 * "/repo-name/prefreim"), и строгое сравнение с "/prefreim" там никогда не сработает.
 */

/** true, если путь ведёт на экран-префрейм (независимо от глубины подкаталога публикации). */
export function isPrefreimPath(pathname: string): boolean {
  return pathname.split('/').filter(Boolean).includes('prefreim');
}

/**
 * Путь основного приложения — тот же адрес, но без сегмента "prefreim". Используется CTA
 * префрейма для возврата в App: обычный window.location.assign('/') сломался бы на
 * GitHub Pages, где сайт живёт не в корне домена.
 */
export function appRootPath(pathname: string): string {
  const segments = pathname.split('/').filter((segment) => segment.length > 0 && segment !== 'prefreim');
  return segments.length > 0 ? `/${segments.join('/')}/` : '/';
}
