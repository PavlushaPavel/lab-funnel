import { useMemo, useRef } from 'react';
import { Check, Circle } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Prose } from '../../ui/Prose';
import { VideoBlock } from '../../ui/VideoBlock';
import { Divider } from '../../ui/Divider';
import { SCREENS } from '../../content/screens';
import { getVideo } from '../../content/video';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const copy = SCREENS['final-video'];
const VIDEO_ID = 'final-video';
const video = getVideo(VIDEO_ID);
const MODULE_LIST = [MODULES.m1, MODULES.m2, MODULES.m3];

/**
 * Список «нужно разобраться» не переписан руками — он разобран из дословного текста
 * src/content/video.ts::VIDEOS['final-video'].description[1] («…приличный кусок технической
 * херни: X, Y, Z.»). Так текст остаётся единственным источником правды в content/*, а UI
 * лишь превращает перечисление внутри предложения в список — без единого хардкода копирайта.
 */
function parseUnresolvedList(paragraph: string): string[] {
  const afterColon = paragraph.split(':')[1] ?? '';
  return afterColon
    .replace(/\.$/, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const PROGRESS_CHECKPOINTS = [0.5];

/**
 * Финальное видео-переход (`final-video`) — мост из фазы ВЕРЮ в фазу ПЛАЧУ. Контраст экрана:
 * три модуля уже закрыты (галочка, --signal) против списка технической херни, которая
 * не закрыта нигде в бесплатной воронке (тот же маркер, что у Bullets — «—», --ink-faint) —
 * это и есть повод для практикума.
 */
export function FinalVideoScreen() {
  const setVideoProgress = useFunnelStore((s) => s.setVideoProgress);
  const next = useFunnelStore((s) => s.next);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const passedCheckpoints = useRef<Set<number>>(new Set());

  const unresolved = useMemo(() => parseUnresolvedList(video.description[1] ?? ''), []);

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
    <Screen id="final-video" phase="believe">
      <div className="grid gap-6 pt-2">
        <div className="grid gap-3">
          <h1 className="t-display-l text-ink">{copy.title}</h1>
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>

        <VideoBlock id={VIDEO_ID} onProgress={handleProgress} />

        <Divider />

        <div className="grid gap-4">
          <div className="grid gap-2">
            <p className="t-label text-ink-faint">ЗАКРЫТО</p>
            <ul className="grid gap-2">
              {MODULE_LIST.map((m) => (
                <li key={m.id} className="grid grid-cols-[16px_1fr] items-start gap-2">
                  <Check weight="regular" size={14} color="var(--signal)" aria-hidden="true" />
                  <span className="t-body-s text-ink">
                    {m.code} · {m.title} — {m.outcome}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2">
            <p className="t-label text-ink-faint">НУЖНО РАЗОБРАТЬСЯ</p>
            <ul className="grid gap-2">
              {unresolved.map((item, i) => (
                <li key={i} className="grid grid-cols-[16px_1fr] items-start gap-2">
                  <Circle weight="regular" size={10} color="var(--ink-faint)" aria-hidden="true" />
                  <span className="t-body-s text-ink-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
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
