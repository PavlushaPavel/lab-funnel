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

const copy = SCREENS['bridge-2'];

/**
 * Мост между модулями 2 и 3 (`bridge-2`, BRIEF.md §13). Усиление ставки: рубленый текст
 * с reveal по абзацам + качественный сдвиг (что человек теперь умеет и чего ещё не умеет),
 * вместо денежного счётчика утечки (аудит продукта: снос выдуманной экономики).
 * В брифе для этого экрана два маркированных списка — интерливинг сохранён по месту в тексте
 * («Теперь ты:» → первая четвёрка, «А ты:» → вторая четвёрка), как и решил контент-агент
 * (см. комментарий в content/screens.ts).
 */
export function Bridge2Screen() {
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

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
      <p className="t-caption">ПЕРЕХОД · М-02 → М-03</p>

      <motion.div
        className="grid gap-3"
        variants={reduced ? undefined : listStagger}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'show'}
      >
        <motion.h1 className="t-display text-ink" variants={reduced ? undefined : listItem}>
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

      <Panel label={`ПОСЛЕ ${MODULES.m2.code}`} status="done">
        <div className="grid gap-3">
          <div className="grid gap-1">
            <span className="t-caption text-ink">ТЕПЕРЬ УМЕЕШЬ</span>
            <p className="t-body text-ink">{MODULES.m2.outcome}</p>
          </div>
          <div className="grid gap-1">
            <span className="t-caption">ПОКА НЕ УМЕЕШЬ</span>
            <p className="t-body-sm text-ink-secondary">
              Показать это на посадочной странице — сайт клиента к этому пока не готов.
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
