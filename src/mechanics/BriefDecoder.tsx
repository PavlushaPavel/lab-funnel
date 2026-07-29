import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Variants } from 'motion/react';
import type { Spec } from '../store/funnel';
import type { BriefDecoderData } from '../content/mechanics';
import { Well } from '../ui/Well';
import { NodeLabel } from '../ui/NodeLabel';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import { cn } from '../lib/cn';
import { haptics } from '../lib/telegram';
import { springPanel, listStagger, easeOut, useReducedMotionSafe } from '../lib/motion';
import { mechanicsDurations } from './localMotion';

interface BriefDecoderProps {
  data: BriefDecoderData;
  spec: Spec;
  onComplete: (result?: unknown) => void;
}

/** Точки разлёта карточек при "распаде" строки — позиционные смещения, не длительности. */
const SHATTER_OFFSETS: { x: number; y: number; rotate: number }[] = [
  { x: -22, y: -12, rotate: -5 },
  { x: 22, y: -9, rotate: 4 },
  { x: -18, y: 14, rotate: -3 },
  { x: 24, y: 11, rotate: 5 },
];

/** hidden читает смещение разлёта из custom-пропа конкретной карточки. */
const cardVariants: Variants = {
  hidden: (offset: { x: number; y: number; rotate: number }) => ({
    opacity: 0,
    scale: 0.85,
    x: offset.x,
    y: offset.y,
    rotate: offset.rotate,
  }),
  show: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, transition: springPanel },
};

/**
 * «Расшифруй бриф» (PRODUCT.md §4.1). Строка демографии физически распадается на 4 карточки
 * реальных ситуаций. Тап по карточке раскрывает причину/страх/запрос. onComplete — после
 * раскрытия всех четырёх.
 */
export function BriefDecoder({ data, onComplete }: BriefDecoderProps) {
  const [decoded, setDecoded] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const reduced = useReducedMotionSafe();
  const completedRef = useRef(false);

  const handleDecode = () => {
    haptics.medium();
    setDecoded(true);
  };

  const handleToggle = (id: string) => {
    haptics.light();
    setRevealed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const allOpen = data.cards.every((c) => next[c.id]);
      if (allOpen && !completedRef.current) {
        completedRef.current = true;
        haptics.success();
        onComplete({ decoded: true });
      }
      return next;
    });
  };

  return (
    <div className="grid gap-4">
      <AnimatePresence mode="wait" initial={false}>
        {!decoded ? (
          <motion.div
            key="line"
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -6 }}
            transition={{ duration: reduced ? 0.12 : mechanicsDurations.decoderBreakGap, ease: easeOut }}
            className="grid gap-3"
          >
            <p className="t-label text-ink-faint">{data.clientLine}</p>
            <Well>
              <p className="t-h2 text-ink">{data.sourceLine}</p>
            </Well>
            <Button variant="primary" full onClick={handleDecode}>
              РАСШИФРОВАТЬ
            </Button>
          </motion.div>
        ) : (
          <motion.div key="cards" className="grid gap-4">
            <p className="t-body-s text-ink-muted">
              Это одна строка из брифа. Внутри — четыре разных человека.
            </p>
            <motion.div
              className="grid grid-cols-1 gap-3"
              variants={reduced ? undefined : listStagger}
              initial={reduced ? undefined : 'hidden'}
              animate={reduced ? undefined : 'show'}
            >
              {data.cards.map((card, i) => {
                const isOpen = Boolean(revealed[card.id]);
                const offset = SHATTER_OFFSETS[i % SHATTER_OFFSETS.length];
                return (
                  <motion.div key={card.id} custom={offset} variants={reduced ? undefined : cardVariants}>
                    <button
                      type="button"
                      onClick={() => handleToggle(card.id)}
                      aria-expanded={isOpen}
                      className="grid w-full gap-3 rounded-lg border border-line bg-panel p-4 text-left"
                      style={{ boxShadow: 'var(--shadow-panel-sheen)' }}
                    >
                      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                        <NodeLabel code={String(i + 1).padStart(2, '0')} title="" status={isOpen ? 'done' : 'locked'} />
                        <span className="t-label text-ink-faint">{isOpen ? 'СВЁРНУТЬ' : 'РАСКРЫТЬ'}</span>
                      </div>
                      <p className="t-h2 text-ink">{card.situation}</p>
                      <motion.div
                        className={cn('grid gap-3 overflow-hidden', !isOpen && 'pointer-events-none')}
                        initial={false}
                        animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? 'auto' : 0 }}
                        transition={{ duration: reduced ? 0.12 : mechanicsDurations.decoderReveal, ease: easeOut }}
                      >
                        <div className="grid gap-1">
                          <span className="t-label text-ink-faint">ПРИЧИНА</span>
                          <span className="t-body-s text-ink">{card.reason}</span>
                        </div>
                        <div className="grid gap-1">
                          <span className="t-label text-ink-faint">СТРАХ</span>
                          <span className="t-body-s text-ink">{card.fear}</span>
                        </div>
                        <div className="grid gap-1">
                          <span className="t-label text-ink-faint">ЗАПРОС</span>
                          <Chip>{card.query}</Chip>
                        </div>
                      </motion.div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
