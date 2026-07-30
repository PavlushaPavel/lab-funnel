import { useRef } from 'react';
import { Circle } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Prose } from '../../ui/Prose';
import { VideoBlock } from '../../ui/VideoBlock';
import { ModuleBadge } from '../../ui/ModuleBadge';
import { SCREENS } from '../../content/screens';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const copy = SCREENS['final-video'];
const VIDEO_ID = 'final-video';
const MODULE_LIST = [MODULES.m1, MODULES.m2, MODULES.m3];

/**
 * Список технической херни — статический массив, набранный ДОСЛОВНО из BRIEF.md §16
 * («Нужно разобраться: какие сервисы нужны; что оплачивать; как оплачивать; как работать
 * из России; как настроить Codex; как установить скиллы; как передавать файлы; как работать
 * с референсами; как исправлять ошибки; как не сломать всё следующей правкой; как публиковать
 * страницу.»). Раньше это парсилось рантаймом из VIDEOS['final-video'].description[1] через
 * split по ':' и ',' — хрупко и ломается при любой правке текста в content/video.ts.
 * Текст экрана — единственный источник правды, а не парсинг чужого предложения.
 */
const UNRESOLVED: string[] = [
  'какие сервисы нужны',
  'что оплачивать',
  'как оплачивать',
  'как работать из России',
  'как настроить Codex',
  'как установить скиллы',
  'как передавать файлы',
  'как работать с референсами',
  'как исправлять ошибки',
  'как не сломать всё следующей правкой',
  'как публиковать страницу',
];

const PROGRESS_CHECKPOINTS = [0.5];

/**
 * Финальное видео-переход (`final-video`) — мост из фазы ВЕРЮ в фазу ПЛАЧУ. Смысл ролика
 * (PRODUCT.md §4-БИС «путь ты видел, но техническая часть — отдельный кусок») несётся не
 * пересказом, а визуальным контрастом: три ПРОЙДЕННЫХ модуля (ModuleBadge 'done', --mint)
 * против списка НЕ ЗАКРЫТЫХ технических пунктов с пустыми маркерами --ink-muted.
 * Описание ролика (video.description) нигде не выводится.
 */
export function FinalVideoScreen() {
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
    <Screen id="final-video" phase="believe">
      <div className="grid gap-6 pt-2">
        <div className="grid gap-3">
          <h1 className="t-display text-ink">{copy.title}</h1>
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>

        <VideoBlock id={VIDEO_ID} onProgress={handleProgress} />

        {/* Контраст пройденного и незакрытого держится на поверхностях и цвете отметки:
            пройденное — мятные отметки прямо на холсте, незакрытое — отдельная белая
            карточка со служебным серым списком (DESIGN.md §3, §6). */}
        <div className="grid gap-2">
          <p className="t-caption">ПРОЙДЕНО</p>
          <div className="flex flex-wrap gap-2">
            {MODULE_LIST.map((m) => (
              <ModuleBadge key={m.id} code={m.code} title={m.title} state="done" size="sm" />
            ))}
          </div>
        </div>

        <div className="bg-card rounded-card-lg p-(--card-pad)">
          <div className="grid gap-3">
            <p className="t-caption">НЕ ЗАКРЫТО</p>
            <ul className="grid gap-2">
              {UNRESOLVED.map((item, i) => (
                <li key={i} className="grid grid-cols-[16px_1fr] items-start gap-2">
                  <Circle
                    weight="regular"
                    size={10}
                    color="var(--ink-muted)"
                    className="mt-1.5"
                    aria-hidden="true"
                  />
                  <span className="t-body-sm text-ink-muted">{item}</span>
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
