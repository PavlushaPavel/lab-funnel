import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { CodeInput } from '../../ui/CodeInput';
import { ModuleBadge } from '../../ui/ModuleBadge';
import type { ModuleBadgeState } from '../../ui/ModuleBadge';
import { Quote } from '../../ui/Quote';
import { Prose } from '../../ui/Prose';
import { SCREENS } from '../../content/screens';
import { MODULES } from '../../content/modules';
import { isVideoPlaceholder } from '../../content/video';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS['m3-code'];
const module3 = MODULES.m3;

/** Нормализация ввода для сравнения с ключевым словом: без учёта регистра и пробелов. */
function normalize(word: string): string {
  return word.toUpperCase().replace(/\s+/g, '');
}

const CODE_WORD = normalize(copy.codeWord ?? '');
// Пока ролик не подключён, ключевое слово неоткуда узнать — показываем его,
// иначе воронка непроходима. С появлением реального src подсказка исчезает сама.
const VIDEO_PENDING = isVideoPlaceholder('m3-video');

/** Подпись под карточкой модуля по фазе проверки кода, как на m1-code/m2-code (CodeStepScreen). */
const TILE_LABEL: Record<ModuleBadgeState, string> = {
  locked: 'Ждём слово',
  active: 'Проверяем',
  done: 'Доступ открыт',
};
const TILE_LABEL_CLASS: Record<ModuleBadgeState, string> = {
  locked: 'text-ink-muted',
  active: 'text-ink-secondary',
  done: 'text-ink',
};

/**
 * Оркестровка появления сцены разблокировки после верного кода: сначала CodeInput сам
 * доигрывает каскадную заливку слотов (lib/motion.ts::durations), затем карточка М-03
 * переходит «активна» → «доступ открыт», и только после паузы — подпись-шутка (см. ниже).
 * Это не пружина/easing (те уже взяты из lib/motion.ts), а сюжетная пауза конкретного
 * экрана, поэтому живёт локально, а не в общем моторном модуле.
 */
const REVEAL = {
  panelDelay: 0.55, // даём CodeInput доиграть каскад заливки, прежде чем карточка «открыта»
  captionDelay: 0.55 + 0.32 + 0.35, // подпись выходит отдельным бит-ом, после самой карточки
  errorHold: 2400, // сколько держим текст ошибки на экране (сам CodeInput чистит слоты быстрее)
} as const;

/**
 * Финальная проверка (`m3-code`) — код ENTER. После успеха карточка М-03 проходит фазами
 * «заперта» → «проверяем» → «доступ открыт» (--mint), показывается outcome модуля (PRODUCT.md §3.5).
 * Код открывает ТОЛЬКО доступ к механике BeforeAfter на следующем экране (store::unlockCode) —
 * модуль засчитывается пройденным (store::completeModule) уже там, после реальной практики.
 * Подпись «Тебе, если что.» — по словам ТЗ, лучшая шутка воронки: чтобы не потерялась в потоке,
 * она выходит отдельным замедленным бит-ом уже ПОСЛЕ основного текста успеха, оформленная
 * как авторская ремарка (компонент Quote), а не как рядовая подпись под полем.
 */
export function M3CodeScreen() {
  const unlockCode = useFunnelStore((s) => s.unlockCode);
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const [solved, setSolved] = useState(false); // код принят, идёт проверка
  const [unlocked, setUnlocked] = useState(false); // карточка «доступ открыт»
  const [showError, setShowError] = useState(false);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    },
    []
  );

  const handleSubmit = (value: string): boolean => {
    track('code_submit', { module: 'm3' });
    const ok = normalize(value) === CODE_WORD;
    if (ok) {
      track('code_success', { module: 'm3' });
      unlockCode('m3');
      setShowError(false);
      setSolved(true);
      window.setTimeout(() => setUnlocked(true), REVEAL.panelDelay * 1000);
      return true;
    }
    track('code_fail', { module: 'm3' });
    setShowError(true);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setShowError(false), REVEAL.errorHold);
    return false;
  };

  const handleContinue = () => {
    haptics.medium();
    next();
  };

  const tileState: ModuleBadgeState = unlocked ? 'done' : solved ? 'active' : 'locked';

  return (
    <Screen id="m3-code" phase="believe">
      <div className="grid gap-6 pt-2">
        <div className="grid gap-3">
          <h1 className="t-display text-ink">{copy.title}</h1>
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>

        <CodeInput length={CODE_WORD.length} onSubmit={handleSubmit} />

        {VIDEO_PENDING && (
          <p className="t-body-sm text-ink-secondary">
            Видео пока не подключено, взять слово неоткуда — на время сборки оно такое:{' '}
            {/* Подсветка слова — единственное назначение --voltage (DESIGN.md §3). */}
            <span className="bg-voltage rounded-button px-1.5 font-mono text-ink tabular-nums">
              {CODE_WORD}
            </span>
          </p>
        )}

        <AnimatePresence>
          {showError && copy.errorTitle && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.24, ease: easeOut }}
              className="grid gap-1"
            >
              <p className="t-subheading text-alert">{copy.errorTitle}</p>
              <Prose>
                {copy.errorBody?.map((p, i) => (
                  <p key={i} className="text-ink-secondary">
                    {p}
                  </p>
                ))}
              </Prose>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Сцена открытия доступа: карточка М-03 проходит заперта → проверяем → доступ открыт. */}
        <div className="grid justify-items-center gap-3 py-2">
          <ModuleBadge code={module3.code} title={module3.title} state={tileState} size="lg" />
          {solved && <span className={`t-caption ${TILE_LABEL_CLASS[tileState]}`}>{TILE_LABEL[tileState]}</span>}
        </div>

        <AnimatePresence>
          {unlocked && (
            <motion.div
              className="grid gap-4"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.32, ease: easeOut }}
            >
              <p className="t-heading-lg text-ink">{copy.successTitle}</p>
              <p className="t-body text-ink-secondary">{module3.outcome}</p>

              {copy.caption && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduced ? 0.12 : 0.3,
                    ease: easeOut,
                    delay: reduced ? 0.1 : REVEAL.captionDelay,
                  }}
                >
                  <Quote>{copy.caption}</Quote>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomBar>
        <Button variant="primary" full disabled={!unlocked} onClick={handleContinue}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
