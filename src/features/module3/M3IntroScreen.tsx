import { motion } from 'motion/react';
import { Lock } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { Prose } from '../../ui/Prose';
import { SCREENS } from '../../content/screens';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';
import { haptics } from '../../lib/telegram';

const copy = SCREENS['m3-intro'];
const module3 = MODULES.m3;

/**
 * Вход в модуль 3 (`m3-intro`) — первый экран фазы ВЕРЮ. Карточка М-03 показана
 * ещё запертой (замок + точка --ink-faint), разблокируется только после кода на m3-code
 * (DESIGN.md §6.2, PRODUCT.md §3.3).
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
          <h1 className="t-display-l text-ink">{copy.title}</h1>
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>

        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut }}
        >
          <Panel label={`${module3.code} · ${module3.title}`} status="locked">
            <div className="grid grid-cols-[40px_1fr] items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md border border-line bg-raised">
                <Lock weight="regular" size={18} color="var(--ink-faint)" aria-hidden="true" />
              </span>
              <p className="t-label text-ink-faint">ЗАПЕРТО · ОТКРОЕТСЯ КОДОМ</p>
            </div>
          </Panel>
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
