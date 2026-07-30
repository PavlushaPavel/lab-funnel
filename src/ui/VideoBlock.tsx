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
  playing: 'ПРОСМОТР ИДЁТ',
  done: 'ПРОСМОТРЕНО',
};

/**
 * Видеоблок (DESIGN.md v3 §6 VideoBlock): обложка 16:9 с --r-card, кнопка Play — чёрный круг
 * 56px с белой иконкой, под обложкой моно caption «название · хронометраж» и статус справа,
 * прогресс — плоская линия. Описаний и расшифровок под плеером нет (§2.13).
 *
 * Работает от src/content/video.ts. Пока src не задан (ролики не подключены), досмотр
 * симулируется за PREVIEW_SECONDS — иначе воронка непроходима.
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

  // Ролик не подключён — симуляция идёт за PREVIEW_SECONDS, а не за реальный хронометраж.
  // Иначе разблокировка «Дальше» требовала бы просидеть 12–25 минут перед пустым прямоугольником.
  const isPlaceholder = !config.src;

  const startSimulated = () => {
    if (simTimer.current) return;
    const tickMs = 250;
    const PREVIEW_SECONDS = 6;
    const duration = isPlaceholder ? PREVIEW_SECONDS : Math.max(config.duration, 1);
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
        className="relative overflow-hidden rounded-card bg-mist"
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
        {isPlaceholder && (
          <span className="t-caption absolute left-3 top-3 rounded-button bg-card px-2 py-1">
            ВИДЕО ЕЩЁ НЕ ПОДКЛЮЧЕНО
          </span>
        )}
        {status !== 'playing' && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label="Смотреть видео"
            className="absolute inset-0 grid place-items-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-pill bg-inverted">
              <Play weight="regular" size={24} color="var(--ink-inverted)" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <span className="t-caption tnum">
          {config.title} · {formatDuration(config.duration)}
        </span>
        <span className={cn('t-caption', status === 'idle' ? undefined : 'text-ink')}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <TickRail progress={progress} />
    </div>
  );
}
