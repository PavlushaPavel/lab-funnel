import { motion } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Prose } from '../../ui/Prose';
import { ElementTile } from '../../ui/ElementTile';
import { SCREENS } from '../../content/screens';
import { MODULES, moduleMass } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { haptics } from '../../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS['m2-intro'];
const MODULE = MODULES.m2;

/**
 * Подводка перед видео модуля 2 (`m2-intro`, BRIEF.md §10). Клетка элемента — главный объект
 * экрана, крупная и запертая (DESIGN.md §6.1).
 */
export function M2IntroScreen() {
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const handleNext = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="m2-intro" phase="want">
      <h1 className="t-display-l text-ink">{copy.title}</h1>
      <Prose>
        {copy.body?.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </Prose>

      <motion.div
        className="grid justify-items-center gap-3 py-4"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut }}
      >
        <ElementTile
          number={MODULE.number}
          symbol={MODULE.symbol}
          name={MODULE.title}
          mass={moduleMass(MODULE.id)}
          state="locked"
          size="lg"
        />
        <p className="t-label text-ink-faint">ЗАПЕРТО · ОТКРОЕТСЯ КОДОМ</p>
      </motion.div>

      <BottomBar>
        <Button variant="primary" full onClick={handleNext}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
