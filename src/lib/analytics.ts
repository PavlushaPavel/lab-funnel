/**
 * Аналитика воронки. Никогда не бросает исключение — трекинг не должен ломать продукт.
 */
import { useFunnelStore } from '../store/funnel';
import { getUser } from './telegram';

export type EventName =
  | 'prefreim_view'
  | 'app_open'
  | 'spec_select'
  | 'quiz_start'
  | 'quiz_answer'
  | 'quiz_complete'
  | 'quiz_result'
  | 'video_start'
  | 'video_progress'
  | 'video_complete'
  | 'code_submit'
  | 'code_success'
  | 'code_fail'
  | 'assistant_open'
  | 'practice_complete'
  | 'mechanic_complete'
  | 'chain_reveal'
  | 'offer_view'
  | 'autoseller_open'
  | 'objection_select'
  | 'checkout_click'
  | 'purchase_success';

const BUFFER_KEY = 'lab-analytics-buffer-v1';
const BUFFER_LIMIT = 200;

function readBuffer(): unknown[] {
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    return raw ? (JSON.parse(raw) as unknown[]) : [];
  } catch {
    return [];
  }
}

function writeBuffer(entries: unknown[]): void {
  try {
    const trimmed = entries.slice(-BUFFER_LIMIT);
    localStorage.setItem(BUFFER_KEY, JSON.stringify(trimmed));
  } catch {
    // хранилище недоступно — не критично
  }
}

export function track(event: EventName, payload: Record<string, unknown> = {}): void {
  try {
    const s = useFunnelStore.getState();
    const enriched = {
      event,
      step: s.step,
      spec: s.spec,
      tier: s.tier,
      elapsedMs: Date.now() - s.startedAt,
      tgUserId: getUser()?.id ?? null,
      ts: Date.now(),
      ...payload,
    };

    const url = import.meta.env.VITE_ANALYTICS_URL;
    if (url) {
      const body = JSON.stringify(enriched);
      const sent = navigator.sendBeacon?.(url, body);
      if (!sent) {
        // sendBeacon недоступен/отклонён — складываем в буфер, не падаем
        writeBuffer([...readBuffer(), enriched]);
      }
    } else {
      writeBuffer([...readBuffer(), enriched]);
      console.debug('[track]', enriched);
    }
  } catch {
    // аналитика никогда не должна ронять приложение
  }
}
