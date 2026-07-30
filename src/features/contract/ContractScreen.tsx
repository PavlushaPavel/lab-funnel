import { useRef } from 'react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { VideoBlock } from '../../ui/VideoBlock';
import { SCREENS } from '../../content/screens';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const copy = SCREENS.contract;
// В содержимом src/content/video.ts ролик контракта живёт под ключом 'contract' (не 'contract-video',
// как указано в постановке задачи) — используется реальный ключ, иначе VideoBlock отрисует
// TODO-заглушку вместо настоящего постера/хронометража ролика.
const VIDEO_ID = 'contract';

/**
 * Контракт недоверия (`contract`) — вход в фазу ХОЧУ. Заголовок, короткий текст, видео и одна
 * кнопка «Не верю. Продолжай». Раньше здесь была расписка из 4 тапаемых чекбоксов
 * («не верь на слово» / «проверяй» / «докапывайся» / «сопротивляйся») — бюрократический
 * ритуал вместо харизмы автора, снесён (аудит продукта). Самый спокойный экран приложения:
 * максимум воздуха, минимум декора, единственный контрастный элемент — чёрная первичная
 * кнопка (DESIGN.md §3).
 */
export function ContractScreen() {
  const setVideoProgress = useFunnelStore((s) => s.setVideoProgress);
  const next = useFunnelStore((s) => s.next);
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  const handleProgress = (p: number) => {
    setVideoProgress(VIDEO_ID, p);
    if (!startedRef.current && p > 0) {
      startedRef.current = true;
      track('video_start', { videoId: VIDEO_ID });
    }
    if (!completedRef.current && p >= 0.999) {
      completedRef.current = true;
      track('video_complete', { videoId: VIDEO_ID });
    }
  };

  const handleContinue = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="contract" phase="want">
      {/* Воздух вместо декора: вертикальный ритм --section-gap, ни рамок, ни подложек. */}
      <div className="grid pt-2" style={{ rowGap: 'var(--section-gap)' }}>
        <div className="grid gap-4">
          <h1 className="t-display text-ink">{copy.title}</h1>
          <div className="grid gap-3">
            {copy.body?.map((p, i) => (
              <p key={i} className="t-body text-ink-secondary">
                {p}
              </p>
            ))}
          </div>
        </div>

        <VideoBlock id={VIDEO_ID} onProgress={handleProgress} />
      </div>

      <BottomBar>
        <Button variant="primary" full onClick={handleContinue}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
