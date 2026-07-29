import { useState } from 'react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { NodeLabel } from '../../ui/NodeLabel';
import { BriefDecoder } from '../../mechanics';
import { getBriefDecoderData } from '../../content/mechanics';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const MODULE = MODULES.m1;
const MECHANIC_KEY = 'm1-decoder';

/**
 * Обёртка механики BriefDecoder (`m1-decoder`, PRODUCT.md §4.1). Механика сама шаг не
 * переключает (ARCHITECTURE.md §9) — экран вызывает completeMechanic + track и разблокирует
 * кнопку «Дальше» по onComplete.
 */
export function M1DecoderScreen() {
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const alreadyDone = useFunnelStore((s) => s.mechanics[MECHANIC_KEY] ?? false);
  const completeMechanic = useFunnelStore((s) => s.completeMechanic);
  const next = useFunnelStore((s) => s.next);
  const [done, setDone] = useState(alreadyDone);
  const data = getBriefDecoderData(spec);

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
    <Screen id="m1-decoder" phase="want">
      <NodeLabel code={MODULE.code} title={MODULE.title} status="active" />

      <div className="grid gap-1">
        <h1 className="t-display-l text-ink">Расшифруй бриф</h1>
        <p className="t-body-s text-ink-muted">
          Одна строка из брифа врёт тебе прямо в лицо. Разберём, что за ней стоит.
        </p>
      </div>

      <BriefDecoder data={data} spec={spec} onComplete={handleComplete} />

      <BottomBar>
        <Button variant="primary" full disabled={!done} onClick={handleNext}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
