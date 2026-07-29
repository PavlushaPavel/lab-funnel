import { motion } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { Bullets } from '../../ui/Bullets';
import { SCREENS } from '../../content/screens';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { haptics } from '../../lib/telegram';
import { listStagger, listItem, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS['bridge-1'];

/**
 * Мост между модулями 1 и 2 (`bridge-1`, BRIEF.md §9). Не проходной экран — усиление ставки:
 * рубленый текст с reveal по абзацам + качественный сдвиг (что человек теперь умеет и чего
 * ещё не умеет), вместо денежного счётчика утечки (аудит продукта: снос выдуманной экономики).
 */
export function Bridge1Screen() {
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

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

      <Panel label={`ПОСЛЕ ${MODULES.m1.code}`} status="done">
        <div className="grid gap-3">
          <div className="grid gap-1">
            <span className="t-label text-acid">ТЕПЕРЬ УМЕЕШЬ</span>
            <p className="t-body text-ink">{MODULES.m1.outcome}</p>
          </div>
          <div className="grid gap-1">
            <span className="t-label text-ink-faint">ПОКА НЕ УМЕЕШЬ</span>
            <p className="t-body-s text-ink-muted">
              Писать сами объявления и офферы под то, что теперь понимаешь про аудиторию.
            </p>
          </div>
        </div>
      </Panel>

      <BottomBar>
        <Button variant="primary" full onClick={handleNext}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
