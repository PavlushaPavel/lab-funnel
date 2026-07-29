import { useRef } from 'react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Prose } from '../../ui/Prose';
import { VideoBlock } from '../../ui/VideoBlock';
import { SCREENS } from '../../content/screens';
import { getVideo } from '../../content/video';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const copy = SCREENS.contract;
// В содержимом src/content/video.ts ролик контракта живёт под ключом 'contract' (не 'contract-video',
// как указано в постановке задачи) — используется реальный ключ, иначе VideoBlock отрисует
// TODO-заглушку вместо настоящего описания/заголовка ролика. Несостыковка отражена в отчёте волны.
const VIDEO_ID = 'contract';
const video = getVideo(VIDEO_ID);

/**
 * Контракт недоверия (`contract`) — вход в фазу ХОЧУ. Самый спокойный экран приложения:
 * максимум воздуха, минимум декора, сигнальный цвет только на кнопке (DESIGN.md §1, §3).
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
      <div className="grid gap-8 pt-2">
        <div className="grid gap-3">
          <h1 className="t-display-l text-ink">{copy.title}</h1>
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>

        <div className="grid gap-3">
          <VideoBlock id={VIDEO_ID} onProgress={handleProgress} />
          <Prose>
            {video.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>
      </div>

      <BottomBar>
        <Button variant="primary" full onClick={handleContinue}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
