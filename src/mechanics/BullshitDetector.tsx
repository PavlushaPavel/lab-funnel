import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Spec } from '../store/funnel';
import type { BullshitDetectorData } from '../content/mechanics';
import { Well } from '../ui/Well';
import { Panel } from '../ui/Panel';
import { Quote } from '../ui/Quote';
import { Bullets } from '../ui/Bullets';
import { Readout } from '../ui/Readout';
import { cn } from '../lib/cn';
import { haptics } from '../lib/telegram';
import { listStagger, listItem, easeOut, useReducedMotionSafe } from '../lib/motion';
import { mechanicsDurations } from './localMotion';

interface BullshitDetectorProps {
  data: BullshitDetectorData;
  spec: Spec;
  onComplete: (result?: unknown) => void;
}

type TapState = 'idle' | 'caught' | 'falsePositive';

/**
 * «Найди херню» (PRODUCT.md §4.2) — главная механика продукта. Пользователь тапает фразы,
 * которые считает водой. Верная находка → зачёркивание + сигнал. Ложное срабатывание на
 * конкретике → --bad + деадпан. onComplete — после того как найдена вся вода.
 */
export function BullshitDetector({ data, onComplete }: BullshitDetectorProps) {
  const [tapped, setTapped] = useState<Record<string, boolean>>({});
  const [showBreakdown, setShowBreakdown] = useState(false);
  const reduced = useReducedMotionSafe();
  const completedRef = useRef(false);

  const waterPhrases = data.phrases.filter((p) => p.isWater);
  const waterTotal = waterPhrases.length;
  const found = waterPhrases.filter((p) => tapped[p.id]).length;
  const falsePositives = data.phrases.filter((p) => !p.isWater && tapped[p.id]).length;

  const handleTap = (id: string, isWater: boolean) => {
    if (tapped[id]) return;
    if (isWater) {
      haptics.light();
    } else {
      haptics.error();
    }
    setTapped((prev) => {
      const next = { ...prev, [id]: true };
      const allFound = waterPhrases.every((p) => next[p.id]);
      if (allFound && !completedRef.current) {
        completedRef.current = true;
        const delay = reduced ? 0 : mechanicsDurations.detectorBreakdownDelay * 1000;
        window.setTimeout(() => {
          setShowBreakdown(true);
          haptics.success();
          onComplete({ found: waterTotal, falsePositives });
        }, delay);
      }
      return next;
    });
  };

  const stateOf = (id: string, isWater: boolean): TapState => {
    if (!tapped[id]) return 'idle';
    return isWater ? 'caught' : 'falsePositive';
  };

  return (
    <div className="grid gap-4">
      <p className="t-body text-ink-muted">{data.intro}</p>

      <Well>
        <motion.div
          className="grid gap-1"
          variants={reduced ? undefined : listStagger}
          initial={reduced ? undefined : 'hidden'}
          animate={reduced ? undefined : 'show'}
        >
          {data.phrases.map((phrase) => {
            const state = stateOf(phrase.id, phrase.isWater);
            return (
              <motion.div key={phrase.id} variants={reduced ? undefined : listItem}>
                <button
                  type="button"
                  onClick={() => handleTap(phrase.id, phrase.isWater)}
                  aria-pressed={tapped[phrase.id] ?? false}
                  className={cn(
                    'grid w-full min-h-11 items-center gap-1 rounded-sm px-3 py-3 text-left',
                    state === 'idle' && 'border-l border-transparent',
                    state === 'caught' && 'border-l-2 bg-signal-dim',
                    state === 'falsePositive' && 'border-l-2 bg-bad-dim'
                  )}
                  style={{
                    borderLeftColor:
                      state === 'caught' ? 'var(--signal)' : state === 'falsePositive' ? 'var(--bad)' : undefined,
                  }}
                >
                  <span
                    className={cn(
                      't-body-s',
                      state === 'caught' ? 'text-ink-muted line-through' : 'text-ink'
                    )}
                  >
                    {phrase.text}
                  </span>
                  {tapped[phrase.id] && (
                    <span className={cn('t-body-s', state === 'falsePositive' ? 'text-bad' : 'text-ink-muted')}>
                      {phrase.comment}
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </Well>

      <div className="grid grid-cols-[auto_1fr] items-baseline gap-3">
        <div className="grid gap-0.5">
          <span className="t-label text-ink-faint">НАЙДЕНО</span>
          <div className="flex items-baseline gap-1">
            <Readout value={found} size="sm" />
            <span className="t-readout-s text-ink-faint">/ {waterTotal}</span>
          </div>
        </div>
        {falsePositives > 0 && (
          <span className="t-label justify-self-end text-bad">ЛОЖНЫХ СРАБАТЫВАНИЙ: {falsePositives}</span>
        )}
      </div>

      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.26, ease: easeOut }}
          >
            <Panel label={data.breakdown.heading} status="done">
              <div className="grid gap-4">
                <Quote>{data.breakdown.waterExample.comment}</Quote>
                <div className="grid gap-2">
                  <span className="t-label text-ink-faint">ЧЕМ КОНКРЕТИКА ОТЛИЧАЕТСЯ ОТ ВОДЫ</span>
                  <Bullets items={data.breakdown.diffPoints} />
                </div>
                <div className="grid gap-2">
                  <span className="t-label text-ink-faint">ЧТО ПРОСИТЬ У НЕЙРОНКИ</span>
                  <Bullets items={data.breakdown.askNeuralNet} />
                </div>
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
