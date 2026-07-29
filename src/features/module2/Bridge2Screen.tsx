import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Well } from '../../ui/Well';
import { Readout } from '../../ui/Readout';
import { Bullets } from '../../ui/Bullets';
import { SCREENS } from '../../content/screens';
import { useFunnelStore, selectLeakCurrent, selectLeakClosedPct, LEAK_WEIGHTS } from '../../store/funnel';
import { formatRub } from '../../lib/format';
import { haptics } from '../../lib/telegram';
import { listStagger, listItem, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS['bridge-2'];

/**
 * Мост между модулями 2 и 3 (`bridge-2`, BRIEF.md §13). Усиление ставки: рубленый текст
 * с reveal по абзацам + счётчик утечки, уменьшившийся за счёт закрытого М-02 (PRODUCT.md §2/§3.1).
 * «Было» — утечка с закрытым только М-01 (М-02 ещё не закрыт), «стало» — текущее значение
 * из стора (selectLeakCurrent), которое уже учитывает оба закрытых модуля. Вес М-01 берётся
 * из LEAK_WEIGHTS, экспортированной из store/funnel.ts — единственный источник этих чисел.
 * В брифе для этого экрана два маркированных списка — интерливинг сохранён по месту в тексте
 * («Теперь ты:» → первая четвёрка, «А ты:» → вторая четвёрка), как и решил контент-агент
 * (см. комментарий в content/screens.ts).
 */
export function Bridge2Screen() {
  const next = useFunnelStore((s) => s.next);
  const leakBase = useFunnelStore((s) => s.leakBase);
  const leakAfter = useFunnelStore(selectLeakCurrent);
  const closedPct = useFunnelStore(selectLeakClosedPct);
  const reduced = useReducedMotionSafe();

  const leakBefore = Math.round(leakBase * (1 - LEAK_WEIGHTS.m1));
  const [displayValue, setDisplayValue] = useState(leakBefore);

  useEffect(() => {
    if (reduced) {
      setDisplayValue(leakAfter);
      return;
    }
    const timer = window.setTimeout(() => setDisplayValue(leakAfter), 500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    haptics.medium();
    next();
  };

  const body = copy.body ?? [];
  const bullets = copy.bullets ?? [];
  const bulletsHead = bullets.slice(0, 4);
  const bulletsTail = bullets.slice(4, 8);
  const bodyMiddle = body.slice(1, 9);
  const bodyTail = body.slice(10);

  return (
    <Screen id="bridge-2" phase="want">
      <p className="t-label text-ink-faint">ПЕРЕХОД · М-02 → М-03</p>

      <motion.div
        className="grid gap-3"
        variants={reduced ? undefined : listStagger}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'show'}
      >
        <motion.h1 className="t-display-l text-ink" variants={reduced ? undefined : listItem}>
          {copy.title}
        </motion.h1>

        {body[0] && (
          <motion.p className="t-body text-ink" variants={reduced ? undefined : listItem}>
            {body[0]}
          </motion.p>
        )}
        {bulletsHead.length > 0 && (
          <motion.div variants={reduced ? undefined : listItem}>
            <Bullets items={bulletsHead} />
          </motion.div>
        )}

        {bodyMiddle.map((paragraph, i) => (
          <motion.p key={i} className="t-body text-ink" variants={reduced ? undefined : listItem}>
            {paragraph}
          </motion.p>
        ))}

        {body[9] && (
          <motion.p className="t-body text-ink" variants={reduced ? undefined : listItem}>
            {body[9]}
          </motion.p>
        )}
        {bulletsTail.length > 0 && (
          <motion.div variants={reduced ? undefined : listItem}>
            <Bullets items={bulletsTail} />
          </motion.div>
        )}

        {bodyTail.map((paragraph, i) => (
          <motion.p key={i + 10} className="t-body text-ink" variants={reduced ? undefined : listItem}>
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
            Было {formatRub(leakBefore)} — узел М-02 закрыт, часть утечки ушла.
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
