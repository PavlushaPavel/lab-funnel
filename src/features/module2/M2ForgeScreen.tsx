import { useState } from 'react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { NodeLabel } from '../../ui/NodeLabel';
import { FormulaForge } from '../../mechanics';
import { getFormulaForgeData } from '../../content/mechanics';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const MODULE = MODULES.m2;
const MECHANIC_KEY = 'm2-forge';

/**
 * Обёртка механики FormulaForge (`m2-forge`, PRODUCT.md §4.4). Механика сама шаг не
 * переключает (ARCHITECTURE.md §9) — экран вызывает completeMechanic + track и разблокирует
 * кнопку «Дальше» по onComplete.
 */
export function M2ForgeScreen() {
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const alreadyDone = useFunnelStore((s) => s.mechanics[MECHANIC_KEY] ?? false);
  const completeMechanic = useFunnelStore((s) => s.completeMechanic);
  const next = useFunnelStore((s) => s.next);
  const [done, setDone] = useState(alreadyDone);
  const data = getFormulaForgeData(spec);

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
    <Screen id="m2-forge" phase="want">
      <NodeLabel code={MODULE.code} title={MODULE.title} status="active" />

      <div className="grid gap-1">
        <h1 className="t-display-l text-ink">Собери оффер</h1>
        <p className="t-body-s text-ink-muted">
          Формулы — не ради красоты. Собери оффер по логике и сравни с тем, что пишут все.
        </p>
      </div>

      <FormulaForge data={data} spec={spec} onComplete={handleComplete} />

      <BottomBar>
        <Button variant="primary" full disabled={!done} onClick={handleNext}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
