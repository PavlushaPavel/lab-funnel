import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Well } from '../../ui/Well';
import { Readout } from '../../ui/Readout';
import { Bullets } from '../../ui/Bullets';
import { SCREENS } from '../../content/screens';
import { useFunnelStore, selectLeakCurrent, selectLeakClosedPct } from '../../store/funnel';
import { formatRub } from '../../lib/format';
import { haptics } from '../../lib/telegram';
import { listStagger, listItem, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS['bridge-1'];

/**
 * Мост между модулями 1 и 2 (`bridge-1`, BRIEF.md §9). Не проходной экран — усиление ставки:
 * рубленый текст с reveal по абзацам + счётчик утечки, который на глазах уменьшается,
 * потому что М-01 закрыт (PRODUCT.md §2 «ХОЧУ», §3.1).
 */
export function Bridge1Screen() {
  const next = useFunnelStore((s) => s.next);
  const leakBase = useFunnelStore((s) => s.leakBase);
  const leakAfter = useFunnelStore(selectLeakCurrent);
  const closedPct = useFunnelStore(selectLeakClosedPct);
  const reduced = useReducedMotionSafe();

  const leakBefore = Math.round(leakBase);
  const [displayValue, setDisplayValue] = useState(leakBefore);

  useEffect(() => {
    if (reduced) {
      setDisplayValue(leakAfter);
      return;
    }
    const timer = window.setTimeout(() => setDisplayValue(leakAfter), 500);
    return () => window.clearTimeout(timer);
    // Разовая просадка счётчика при входе на мост — значения стабильны на время жизни экрана.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    haptics.medium();
    next();
  };

  const bodyHead = copy.body?.slice(0, 3) ?? [];
  const bodyTail = copy.body?.slice(3) ?? [];

  return (
    <Screen id="bridge-1" phase="want">
      <p className="t-label text-ink-faint">ПЕРЕХОД · М-01 → М-02</p>

      <motion.div
        className="grid gap-3"
        variants={reduced ? undefined : listStagger}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'show'}
      >
        <motion.h1 className="t-display-l text-ink" variants={reduced ? undefined : listItem}>
          {copy.title}
        </motion.h1>
        {bodyHead.map((paragraph, i) => (
          <motion.p key={i} className="t-body text-ink" variants={reduced ? undefined : listItem}>
            {paragraph}
          </motion.p>
        ))}
        {copy.bullets && (
          <motion.div variants={reduced ? undefined : listItem}>
            <Bullets items={copy.bullets} />
          </motion.div>
        )}
        {bodyTail.map((paragraph, i) => (
          <motion.p key={i + bodyHead.length} className="t-body text-ink" variants={reduced ? undefined : listItem}>
            {paragraph}
          </motion.p>
        ))}
      </motion.div>

      <Well>
        <div className="grid gap-1">
          <div className="grid grid-cols-[1fr_auto] items-baseline">
            <span className="t-label text-ink-faint">УТЕЧКА СЕЙЧАС</span>
            <span className="t-label text-acid">ЗАКРЫТО НА {closedPct}%</span>
          </div>
          <div style={{ color: 'var(--rust)' }}>
            <Readout value={displayValue} suffix="₽" />
          </div>
          <span className="t-body-s text-ink-muted">
            Было {formatRub(leakBefore)} — узел М-01 закрыт, часть утечки ушла.
          </span>
        </div>
      </Well>

      <BottomBar hint="ОЦЕНКА. НЕ ОБЕЩАНИЕ.">
        <Button variant="primary" full onClick={handleNext}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
