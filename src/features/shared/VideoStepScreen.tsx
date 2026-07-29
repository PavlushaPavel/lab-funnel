import { useRef, useState } from 'react';
import { Lock } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { NodeLabel } from '../../ui/NodeLabel';
import { Panel } from '../../ui/Panel';
import { Prose } from '../../ui/Prose';
import { VideoBlock } from '../../ui/VideoBlock';
import { VIDEOS } from '../../content/video';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import type { ModuleId, Phase, StepId } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

interface VideoStepScreenProps {
  stepId: StepId;
  videoId: string;
  moduleId: ModuleId;
  phase: Phase;
}

/** Доли просмотра, на которых репортим video_progress — чтобы не спамить аналитику каждый кадр. */
const PROGRESS_MILESTONES = [0.25, 0.5, 0.75] as const;

/**
 * Общий экран видео модулей 1/2 (ARCHITECTURE.md §7 VideoBlock, PRODUCT.md §6).
 * Параметризован модулем и видео — конкретные M1VideoScreen/M2VideoScreen лишь подставляют id.
 * Прогресс идёт в стор через setVideoProgress; video_start/video_progress/video_complete —
 * в аналитику. Кнопка «Дальше» заблокирована, пока ролик не досмотрен: без этого зритель
 * не увидит ключевое слово кода, а модуль работает только через явный просмотр.
 */
export function VideoStepScreen({ stepId, videoId, moduleId, phase }: VideoStepScreenProps) {
  const next = useFunnelStore((s) => s.next);
  const setVideoProgress = useFunnelStore((s) => s.setVideoProgress);
  const module = MODULES[moduleId];
  const video = VIDEOS[videoId];

  const [status, setStatus] = useState<'idle' | 'playing' | 'done'>('idle');
  const startedRef = useRef(false);
  const doneRef = useRef(false);
  const milestonesRef = useRef<Set<number>>(new Set());

  const handleProgress = (p: number) => {
    setVideoProgress(videoId, p);

    if (!startedRef.current && p > 0) {
      startedRef.current = true;
      setStatus('playing');
      track('video_start', { videoId, module: moduleId });
    }

    for (const milestone of PROGRESS_MILESTONES) {
      if (p >= milestone && !milestonesRef.current.has(milestone)) {
        milestonesRef.current.add(milestone);
        track('video_progress', { videoId, module: moduleId, progress: milestone });
      }
    }

    if (p >= 0.999 && !doneRef.current) {
      doneRef.current = true;
      setStatus('done');
      track('video_complete', { videoId, module: moduleId });
    }
  };

  const handleNext = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id={stepId} phase={phase}>
      <NodeLabel code={module.code} title={module.title} status="locked" />

      <h1 className="t-display-l text-ink">{video.title}</h1>

      <VideoBlock id={videoId} onProgress={handleProgress} />

      <Prose>
        {video.description.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </Prose>

      <Panel label="ДАЛЬШЕ" status="locked">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <Lock weight="regular" size={20} color="var(--ink-faint)" aria-hidden="true" />
          <p className="t-body-s text-ink-muted">
            После видео понадобится ключевое слово — оно прозвучит в ролике. Без него узел{' '}
            {module.code} не откроется.
          </p>
        </div>
      </Panel>

      <BottomBar>
        <Button variant="primary" full disabled={status !== 'done'} onClick={handleNext}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
