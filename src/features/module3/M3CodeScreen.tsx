import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { CodeInput } from '../../ui/CodeInput';
import { ScanLine } from '../../ui/ScanLine';
import { ElementTile } from '../../ui/ElementTile';
import type { ElementState } from '../../ui/ElementTile';
import { Quote } from '../../ui/Quote';
import { Prose } from '../../ui/Prose';
import { SCREENS } from '../../content/screens';
import { MODULES, moduleMass } from '../../content/modules';
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

/** Подпись под клеткой по фазе синтеза, как на m1-code/m2-code (CodeStepScreen). */
const TILE_LABEL: Record<ElementState, string> = {
  locked: 'ЖДЁТ ФОРМУЛЫ',
  active: 'ИДЁТ СИНТЕЗ…',
  obtained: 'ПОЛУЧЕНО',
};
const TILE_LABEL_CLASS: Record<ElementState, string> = {
  locked: 'text-ink-faint',
  active: 'text-acid',
  obtained: 'text-sky',
};

/**
 * Оркестровка появления сцены разблокировки после верного кода: сначала CodeInput сам
 * доигрывает каскад слотов + скан-линию (lib/motion.ts::durations), затем клетка М-03
 * переходит «активна» → «получена», и только после паузы — подпись-шутка (см. ниже).
 * Это не пружина/easing (те уже взяты из lib/motion.ts), а сюжетная пауза конкретного
 * экрана, поэтому живёт локально, а не в общем моторном модуле.
 */
const REVEAL = {
  panelDelay: 0.55, // даём CodeInput доиграть каскад + скан-линию, прежде чем клетка «получена»
  captionDelay: 0.55 + 0.32 + 0.35, // подпись выходит отдельным бит-ом, после самой клетки
  errorHold: 2400, // сколько держим текст ошибки на экране (сам CodeInput чистит слоты быстрее)
} as const;

/**
 * Финальная проверка (`m3-code`) — код ENTER. После успеха клетка М-03 проходит фазами
 * «заперта» → «идёт синтез» → «получена» (--sky), показывается outcome модуля (PRODUCT.md §3.5).
 * Подпись «Тебе, если что.» — по словам ТЗ, лучшая шутка воронки: чтобы не потерялась в потоке,
 * она выходит отдельным замедленным бит-ом уже ПОСЛЕ основного текста успеха, оформленная
 * как авторская ремарка (компонент Quote), а не как рядовая подпись под полем.
 */
export function M3CodeScreen() {
  const unlockCode = useFunnelStore((s) => s.unlockCode);
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const [solved, setSolved] = useState(false); // код принят, идёт синтез
  const [unlocked, setUnlocked] = useState(false); // клетка «получена»
  const [showError, setShowError] = useState(false);
  const scanTriggerRef = useRef(0);
  const [scanTrigger, setScanTrigger] = useState(0);
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
      scanTriggerRef.current += 1;
      setScanTrigger(scanTriggerRef.current);
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

  const tileState: ElementState = unlocked ? 'obtained' : solved ? 'active' : 'locked';

  return (
    <Screen id="m3-code" phase="believe">
      <div className="grid gap-6 pt-2">
        <div className="grid gap-3">
          <h1 className="t-display-l text-ink">{copy.title}</h1>
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>

        <div className="relative">
          <CodeInput length={CODE_WORD.length} onSubmit={handleSubmit} />
          <ScanLine trigger={scanTrigger > 0} />
        </div>

        {VIDEO_PENDING && (
          <p className="t-body-s text-ink-muted">
            Видео пока не подключено, взять слово неоткуда — на время сборки оно такое:{' '}
            <span className="t-readout-s text-acid">{CODE_WORD}</span>
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
              <p className="t-h2" style={{ color: 'var(--bad)' }}>
                {copy.errorTitle}
              </p>
              <Prose>
                {copy.errorBody?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Prose>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Сцена получения вещества: клетка М-03 проходит заперта → идёт синтез → получена. */}
        <div className="grid justify-items-center gap-3 py-2">
          <ElementTile
            number={module3.number}
            symbol={module3.symbol}
            name={module3.title}
            mass={moduleMass(module3.id)}
            state={tileState}
            size="lg"
          />
          {solved && <span className={`t-label ${TILE_LABEL_CLASS[tileState]}`}>{TILE_LABEL[tileState]}</span>}
        </div>

        <AnimatePresence>
          {unlocked && (
            <motion.div
              className="grid gap-4"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.32, ease: easeOut }}
            >
              <p className="t-h1 text-ink">{copy.successTitle}</p>
              <p className="t-body-s text-ink-muted">{module3.outcome}</p>

              {copy.caption && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
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
