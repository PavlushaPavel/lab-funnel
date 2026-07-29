import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CursorClick, X } from '@phosphor-icons/react';
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
        {/* Карточки-фразы: крупный текст + бордер + иконка-курсор — явная аффорданса тапа.
            Ключевая обучающая механика продукта, поэтому фразы должны читаться как кнопки
            с первого взгляда, без подсказок. */}
        <motion.div
          className="grid gap-2"
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
                    'grid min-h-14 w-full grid-cols-[24px_1fr] items-start gap-3 rounded-md border bg-raised px-4 py-3.5 text-left',
                    state === 'idle' && 'border-line',
                    state === 'caught' && 'border-line-acid bg-acid-dim',
                    state === 'falsePositive' && 'border-bad bg-bad-dim'
                  )}
                  style={{
                    borderLeftWidth: state === 'idle' ? 1 : 2,
                    borderLeftColor:
                      state === 'caught' ? 'var(--acid)' : state === 'falsePositive' ? 'var(--bad)' : undefined,
                  }}
                >
                  <span className="pt-0.5" aria-hidden="true">
                    {state === 'idle' && <CursorClick weight="regular" size={18} color="var(--ink-faint)" />}
                    {state === 'caught' && <Check weight="bold" size={18} color="var(--acid)" />}
                    {state === 'falsePositive' && <X weight="bold" size={18} color="var(--bad)" />}
                  </span>
                  <span className="grid gap-1">
                    <span
                      className={cn(
                        't-body',
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
                  </span>
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
          // .t-label задаёт цвет ink-faint неслойным правилом (globals.css), которое перебивает
          // слойные Tailwind-утилиты text-*; поэтому цвет предупреждения — инлайн-стилем.
          <span className="t-label justify-self-end text-bad">
            ЛОЖНЫХ СРАБАТЫВАНИЙ: {falsePositives}
          </span>
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
