import { motion } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Prose } from '../../ui/Prose';
import { ModuleBadge } from '../../ui/ModuleBadge';
import { SCREENS } from '../../content/screens';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';
import { haptics } from '../../lib/telegram';

const copy = SCREENS['m3-intro'];
const module3 = MODULES.m3;

/**
 * Вход в модуль 3 (`m3-intro`) — первый экран фазы ВЕРЮ. Карточка М-03 показана ещё запертой,
 * крупная и в центре внимания — разблокируется только после кода на m3-code.
 */
export function M3IntroScreen() {
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const handleStart = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="m3-intro" phase="believe">
      <div className="grid gap-6 pt-2">
        <div className="grid gap-3">
          <h1 className="t-display text-ink">{copy.title}</h1>
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>

        <motion.div
          className="grid justify-items-center gap-3 py-4"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut }}
        >
          <ModuleBadge code={module3.code} title={module3.title} state="locked" size="lg" />
          <p className="t-caption">ЗАПЕРТО · ОТКРОЕТСЯ КОДОМ</p>
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
