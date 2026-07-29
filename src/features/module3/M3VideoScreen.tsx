import { useRef } from 'react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { NodeLabel } from '../../ui/NodeLabel';
import { Prose } from '../../ui/Prose';
import { VideoBlock } from '../../ui/VideoBlock';
import { getVideo } from '../../content/video';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const VIDEO_ID = 'm3-video';
const video = getVideo(VIDEO_ID);
const module3 = MODULES.m3;

/**
 * Пороги, на которых шлём video_progress — не на каждый кадр (иначе аналитика захлебнётся),
 * а в контрольных точках. Значения не про motion/CSS-анимацию, поэтому не в lib/motion.ts.
 */
const PROGRESS_CHECKPOINTS = [0.25, 0.5, 0.75];

/**
 * Видео модуля 3 (`m3-video`) — «Как из анализа ЦА и офферов собрать рабочую посадочную
 * страницу». Модуль ещё заперт (код вводится следующим экраном), поэтому статус-точка
 * узла остаётся --ink-faint (DESIGN.md §6.2).
 */
export function M3VideoScreen() {
  const setVideoProgress = useFunnelStore((s) => s.setVideoProgress);
  const next = useFunnelStore((s) => s.next);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const passedCheckpoints = useRef<Set<number>>(new Set());

  const handleProgress = (p: number) => {
    setVideoProgress(VIDEO_ID, p);
    if (!startedRef.current && p > 0) {
      startedRef.current = true;
      track('video_start', { videoId: VIDEO_ID });
    }
    for (const checkpoint of PROGRESS_CHECKPOINTS) {
      if (p >= checkpoint && !passedCheckpoints.current.has(checkpoint)) {
        passedCheckpoints.current.add(checkpoint);
        track('video_progress', { videoId: VIDEO_ID, progress: checkpoint });
      }
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
    <Screen id="m3-video" phase="believe">
      <div className="grid gap-6 pt-2">
        <NodeLabel code={module3.code} title={module3.title} status="locked" />

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
        {/* В брифе (§14) для перехода после видео 3 отдельной кнопки нет — код вводится
            следующим экраном m3-code. Навигационная подпись авторская, не рекламный копирайт. */}
        <Button variant="primary" full onClick={handleContinue}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
