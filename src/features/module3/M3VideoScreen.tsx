import { useRef, useState } from 'react';
import { Lock } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { Quote } from '../../ui/Quote';
import { VideoBlock } from '../../ui/VideoBlock';
import { ElementTile } from '../../ui/ElementTile';
import { getVideo } from '../../content/video';
import { MODULES, moduleMass } from '../../content/modules';
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
 * Фраза-ставка видео 3 — дословно из BRIEF.md §0 «Сдвиг мысли по ходу воронки»
 * (после третьего видео), не пересказ содержания ролика (DESIGN.md §2.2).
 */
const STAKE_PHRASE = 'После этого видео: «Я теперь могу влиять не только на рекламный кабинет, но и на посадочную».';

/**
 * Видео модуля 3 (`m3-video`) — «Как из анализа ЦА и офферов собрать рабочую посадочную
 * страницу». Модуль ещё заперт (код вводится следующим экраном), поэтому клетка модуля
 * остаётся в состоянии 'locked' (DESIGN.md §6.1).
 *
 * Экран пустой (PRODUCT.md §4-БИС): обложка, хронометраж/статус (несёт VideoBlock), одна
 * фраза-ставка и предупреждение про ключевое слово — без расшифровки и пересказа ролика.
 * Кнопка «Дальше» заблокирована до досмотра — так же, как у VideoStepScreen модулей 1/2.
 */
export function M3VideoScreen() {
  const setVideoProgress = useFunnelStore((s) => s.setVideoProgress);
  const next = useFunnelStore((s) => s.next);
  const [status, setStatus] = useState<'idle' | 'playing' | 'done'>('idle');
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const passedCheckpoints = useRef<Set<number>>(new Set());

  const handleProgress = (p: number) => {
    setVideoProgress(VIDEO_ID, p);
    if (!startedRef.current && p > 0) {
      startedRef.current = true;
      setStatus('playing');
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
      setStatus('done');
      track('video_complete', { videoId: VIDEO_ID });
    }
  };

  const handleContinue = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="m3-video" phase="believe">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <h1 className="t-display-l text-ink">{video.title}</h1>
        <ElementTile
          number={module3.number}
          symbol={module3.symbol}
          name={module3.title}
          mass={moduleMass('m3')}
          state="locked"
          size="sm"
        />
      </div>

      <VideoBlock id={VIDEO_ID} onProgress={handleProgress} />

      <Quote>{STAKE_PHRASE}</Quote>

      <Panel label="ДАЛЬШЕ" status="locked">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <Lock weight="regular" size={20} color="var(--ink-faint)" aria-hidden="true" />
          <p className="t-body-s text-ink-muted">
            После видео понадобится ключевое слово — оно прозвучит в ролике. Без него узел{' '}
            {module3.code} не откроется.
          </p>
        </div>
      </Panel>

      <BottomBar>
        {/* В брифе (§14) для перехода после видео 3 отдельной кнопки нет — код вводится
            следующим экраном m3-code. Навигационная подпись авторская, не рекламный копирайт. */}
        <Button variant="primary" full disabled={status !== 'done'} onClick={handleContinue}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
