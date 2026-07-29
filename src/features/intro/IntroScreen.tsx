import { motion } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { NodeLabel } from '../../ui/NodeLabel';
import { TickRail } from '../../ui/TickRail';
import { Prose } from '../../ui/Prose';
import { SCREENS } from '../../content/screens';
import { useFunnelStore } from '../../store/funnel';
import { durations, easeOut, useReducedMotionSafe } from '../../lib/motion';
import { haptics } from '../../lib/telegram';

const copy = SCREENS.intro;

/**
 * Локальные тайминги «загрузки прибора» — только для интро (ARCHITECTURE.md §11.3:
 * пружины/базовые длительности берутся из lib/motion.ts, но точечные задержки конкретного
 * экрана собираются одним модульным объектом, а не разбрасываются магическими числами по JSX).
 */
const BOOT = {
  labelDelay: durations.tickDraw + 0.05,
  titleDelay: durations.tickDraw + 0.25,
  bodyDelay: durations.tickDraw + 0.45,
} as const;

/**
 * Первый экран продукта: «бут» измерительного прибора. Сначала прорисовывается калибровочная
 * шкала, затем проявляется маркировка узла, затем заголовок и текст (DESIGN.md §6.1, §8).
 * За секунду должно быть понятно: это прибор, а не курс.
 */
export function IntroScreen() {
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const handleStart = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="intro" phase="know">
      <div className="grid gap-6 pt-2">
        {reduced ? (
          <TickRail progress={1} height={20} />
        ) : (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: durations.tickDraw, ease: easeOut }}
            style={{ transformOrigin: 'left' }}
          >
            <TickRail progress={1} height={20} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: easeOut, delay: reduced ? 0 : BOOT.labelDelay }}
        >
          <NodeLabel code="ЛАБОРАТОРИЯ" title="ПРИБОР АКТИВЕН" status="active" />
        </motion.div>

        <motion.h1
          className="t-display-xl text-ink"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: easeOut, delay: reduced ? 0 : BOOT.titleDelay }}
        >
          {copy.title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: easeOut, delay: reduced ? 0 : BOOT.bodyDelay }}
        >
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </motion.div>
      </div>

      <BottomBar>
        <Button variant="primary" full onClick={handleStart}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
