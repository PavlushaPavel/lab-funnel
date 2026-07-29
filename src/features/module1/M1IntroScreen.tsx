import { motion } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Prose } from '../../ui/Prose';
import { ModuleBadge } from '../../ui/ModuleBadge';
import { SCREENS } from '../../content/screens';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { haptics } from '../../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS['m1-intro'];
const MODULE = MODULES.m1;

/**
 * Подводка перед видео модуля 1 (`m1-intro`, BRIEF.md §6). Карточка модуля — крупная и
 * запертая: человек видит, какой узел воронки откроется дальше.
 */
export function M1IntroScreen() {
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const handleNext = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="m1-intro" phase="want">
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
        <ModuleBadge code={MODULE.code} title={MODULE.title} state="locked" size="lg" />
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
