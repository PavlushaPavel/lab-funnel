import { useEffect, useRef, useState } from 'react';
import { Play } from '@phosphor-icons/react';
import { getVideo } from '../content/video';
import { TickRail } from './TickRail';
import { cn } from '../lib/cn';

interface VideoBlockProps {
  id: string;
  onProgress: (p: number) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

type PlayStatus = 'idle' | 'playing' | 'done';

const STATUS_LABEL: Record<PlayStatus, string> = {
  idle: 'НЕ ПРОСМОТРЕНО',
  playing: 'ИДЁТ',
  done: 'ПРОСМОТРЕНО',
};

/**
 * Видеоблок работает от src/content/video.ts. Если src не задан (заглушка) —
 * досмотр симулируется таймером в темпе duration, чтобы логика досмотра была рабочей уже сейчас.
 */
export function VideoBlock({ id, onProgress }: VideoBlockProps) {
  const config = getVideo(id);
  const [status, setStatus] = useState<PlayStatus>('idle');
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (simTimer.current) clearInterval(simTimer.current);
  }, []);

  const reportProgress = (p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    setProgress(clamped);
    onProgress(clamped);
    if (clamped >= 0.999) setStatus('done');
  };

  const startSimulated = () => {
    if (simTimer.current) return;
    const tickMs = 250;
    const duration = Math.max(config.duration, 1);
    simTimer.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + tickMs / 1000 / duration;
        reportProgress(next);
        if (next >= 1 && simTimer.current) {
          clearInterval(simTimer.current);
          simTimer.current = null;
        }
        return next;
      });
    }, tickMs);
  };

  const handlePlay = () => {
    setStatus('playing');
    if (config.src && videoRef.current) {
      videoRef.current.play().catch(() => {
        /* автозапуск может быть заблокирован — статус останется "playing" до взаимодействия */
      });
      return;
    }
    startSimulated();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    reportProgress(v.currentTime / v.duration);
  };

  return (
    <div className="grid gap-2">
      <div
        className="relative overflow-hidden rounded-lg bg-raised"
        style={{ aspectRatio: '16 / 9' }}
      >
        {config.poster && (
          <img src={config.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {config.src && (
          <video
            ref={videoRef}
            src={config.src}
            poster={config.poster}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => reportProgress(1)}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
          />
        )}
        {status !== 'playing' && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label="Смотреть видео"
            className="absolute inset-0 grid place-items-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-acid">
              <Play weight="regular" size={24} color="var(--ink-invert)" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center">
        <span className="t-readout-s text-ink-muted">
          {config.title} · {formatDuration(config.duration)}
        </span>
        <span
          className={cn('t-label', status === 'idle' ? 'text-ink-faint' : 'text-acid')}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>
      <TickRail progress={progress} height={10} />
    </div>
  );
}
