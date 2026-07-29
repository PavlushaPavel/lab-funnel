import { useState } from 'react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { NodeLabel } from '../../ui/NodeLabel';
import { BullshitDetector } from '../../mechanics';
import { getBullshitDetectorData } from '../../content/mechanics';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const MODULE = MODULES.m1;
const MECHANIC_KEY = 'm1-detector';

/**
 * Обёртка ключевой механики BullshitDetector (`m1-detector`, PRODUCT.md §4.2).
 * Экран не засоряется — только маркировка узла, подводка в одну фразу и сама механика,
 * ей нужен воздух. completeMechanic + track — в onComplete, шаг механика не переключает.
 */
export function M1DetectorScreen() {
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const alreadyDone = useFunnelStore((s) => s.mechanics[MECHANIC_KEY] ?? false);
  const completeMechanic = useFunnelStore((s) => s.completeMechanic);
  const next = useFunnelStore((s) => s.next);
  const [done, setDone] = useState(alreadyDone);
  const data = getBullshitDetectorData(spec);

  const handleComplete = () => {
    if (done) return;
    setDone(true);
    completeMechanic(MECHANIC_KEY);
    track('mechanic_complete', { mechanic: MECHANIC_KEY });
  };

  const handleNext = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="m1-detector" phase="want">
      <NodeLabel code={MODULE.code} title={MODULE.title} status="active" />

      <h1 className="t-display-l text-ink">Найди херню</h1>

      <BullshitDetector data={data} spec={spec} onComplete={handleComplete} />

      <BottomBar>
        <Button variant="primary" full disabled={!done} onClick={handleNext}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
