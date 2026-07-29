/**
 * Планировщик фоновых задач в простое браузера — используется для префетча чанка
 * следующего шага воронки (App.tsx), чтобы не конкурировать с рендером текущего экрана.
 * requestIdleCallback есть не везде (WebView Telegram на iOS его не поддерживает) —
 * в этом случае откатываемся на короткий setTimeout.
 */

/** Выполняет callback, когда браузер свободен (или через timeout мс, если так и не дождались). */
export function scheduleIdle(callback: () => void, timeout = 1500): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback?.(handle);
  }

  const id = window.setTimeout(callback, 200);
  return () => window.clearTimeout(id);
}
