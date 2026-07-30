import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CursorClick, X } from '@phosphor-icons/react';
import type { Spec } from '../store/funnel';
import type { BullshitDetectorData } from '../content/mechanics';
import { Panel } from '../ui/Panel';
import { Quote } from '../ui/Quote';
import { Bullets } from '../ui/Bullets';
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

/** Двузначная нумерация счётчика — моно-аннотация системы (DESIGN.md §6, §4: числа табличные). */
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * «Найди херню» (PRODUCT.md §4.2) — главная механика продукта. Пользователь тапает фразы,
 * которые считает водой. Верная находка → заливка --mint + зачёркивание. Ложное срабатывание
 * на конкретике → рамка --alert + деадпан. onComplete — после того как найдена вся вода.
 *
 * Мир v3 (DESIGN.md §3, §6): фразы — белые карточки прямо на холсте, отделяются контрастом
 * поверхности, без рамок и теней. Тап-аффорданса даётся иконкой курсора и кеглем .t-body,
 * а не «приборной» обводкой из снятого тёмного мира.
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
    <div className="grid gap-(--sp-3)">
      <p className="t-body text-ink-secondary">{data.intro}</p>

      {/* Карточки-фразы: белая поверхность, крупный радиус, кегль .t-body и иконка курсора —
          читаются как тапабельные с первого взгляда, без подсказок. Высота ≥56px (§8). */}
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
                  'grid min-h-14 w-full grid-cols-[20px_1fr] items-start gap-3 rounded-card px-4 py-4 text-left',
                  state === 'caught' ? 'bg-mint' : 'bg-card'
                )}
                style={{
                  // Рамка есть всегда, но видима только у ложного срабатывания (§3: --alert
                  // работает границей и текстом, не заливкой). Прозрачная рамка в остальных
                  // состояниях держит размер карточки неизменным при переключении.
                  border:
                    state === 'falsePositive'
                      ? '1.5px solid var(--alert)'
                      : '1.5px solid transparent',
                }}
              >
                <span className="pt-0.5" aria-hidden="true">
                  {state === 'idle' && <CursorClick weight="regular" size={18} color="var(--ink-muted)" />}
                  {state === 'caught' && <Check weight="regular" size={18} color="var(--ink)" />}
                  {state === 'falsePositive' && <X weight="regular" size={18} color="var(--alert)" />}
                </span>
                <span className="grid gap-1">
                  <span className={cn('t-body text-ink', state === 'caught' && 'line-through')}>
                    {phrase.text}
                  </span>
                  {tapped[phrase.id] && (
                    <span
                      className={cn(
                        't-body-sm',
                        state === 'falsePositive' ? 'text-alert' : 'text-ink-secondary'
                      )}
                    >
                      {phrase.comment}
                    </span>
                  )}
                </span>
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Счётчик найденного — моно-аннотация, а не «прибор» (§6 моно-лейбл). */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="t-caption tnum text-ink">
          НАЙДЕНО {pad2(found)} / {pad2(waterTotal)}
        </span>
        {falsePositives > 0 && (
          <span className="t-caption tnum text-alert">ЛОЖНЫХ СРАБАТЫВАНИЙ: {pad2(falsePositives)}</span>
        )}
      </div>

      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.26, ease: easeOut }}
          >
            <Panel label={data.breakdown.heading} status="done">
              <div className="grid gap-(--sp-3)">
                <Quote>{data.breakdown.waterExample.comment}</Quote>
                <div className="grid gap-2">
                  <span className="t-caption">ЧЕМ КОНКРЕТИКА ОТЛИЧАЕТСЯ ОТ ВОДЫ</span>
                  <Bullets items={data.breakdown.diffPoints} />
                </div>
                <div className="grid gap-2">
                  <span className="t-caption">ЧТО ПРОСИТЬ У НЕЙРОНКИ</span>
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
