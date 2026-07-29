import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { NodeLabel } from '../../ui/NodeLabel';
import { BeforeAfter } from '../../mechanics/BeforeAfter';
import { getBeforeAfterData } from '../../content/mechanics';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';

const module3 = MODULES.m3;

/**
 * Механика «До / после» (`m3-beforeafter`, PRODUCT.md §4.5) — доказательство, что страница
 * собралась из работы модулей 1 и 2, а не из воздуха. Механика сама не переключает шаг
 * (ARCHITECTURE.md §9) — экран слушает onComplete, фиксирует mechanic_complete и только
 * тогда открывает кнопку продолжения.
 */
export function M3BeforeAfterScreen() {
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const completeMechanic = useFunnelStore((s) => s.completeMechanic);
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const [done, setDone] = useState(false);
  const data = getBeforeAfterData(spec);

  const handleComplete = () => {
    completeMechanic('before-after');
    track('mechanic_complete', { mechanic: 'before-after' });
    haptics.success();
    setDone(true);
  };

  const handleContinue = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="m3-beforeafter" phase="believe">
      <div className="grid gap-6 pt-2">
        <NodeLabel code={module3.code} title={module3.title} status="active" />

        <Panel status={done ? 'done' : 'active'}>
          <BeforeAfter data={data} spec={spec} onComplete={handleComplete} />
        </Panel>

        <AnimatePresence>
          {done && (
            <motion.p
              className="t-body text-ink"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.28, ease: easeOut }}
            >
              {module3.outcome}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <BottomBar>
        {/* В брифе нет отдельного текста кнопки для этого экрана (реальный вывод даёт сама
            механика) — навигационная подпись авторская, разблокируется только после осмотра
            всех точек в BeforeAfter. */}
        <Button variant="primary" full disabled={!done} onClick={handleContinue}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
