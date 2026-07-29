import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Well } from '../../ui/Well';
import { Readout } from '../../ui/Readout';
import { Bullets } from '../../ui/Bullets';
import { Quote } from '../../ui/Quote';
import { Prose } from '../../ui/Prose';
import { ModuleChain } from '../../mechanics/ModuleChain';
import { getModuleChainData } from '../../content/mechanics';
import { SCREENS } from '../../content/screens';
import { useFunnelStore, selectLeakCurrent, selectLeakClosedPct } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS.chain;

type ScenePhase = 'lead' | 'chain' | 'result';

/**
 * Тайминги сцены, специфичные для этого экрана (не пружины/easing — те по-прежнему только
 * из lib/motion.ts). Короткая подводка держится на экране ровно один вдох, прежде чем
 * уступить место анимации сборки — «дай сцене место» из ТЗ волны.
 */
const SCENE = {
  leadHoldMs: 1100,
  leadHoldReducedMs: 260,
  resultReveal: 0.34,
} as const;

/**
 * Сборка цепочки (`chain`) — кульминация всего приложения (PRODUCT.md §3.4). Три такта:
 * 1) короткая фраза-подводка (лендинг не собрался из воздуха — модули уже закрыты);
 * 2) сама анимация ModuleChain, без единого постороннего элемента на экране —
 *    единственный экземпляр механики монтируется один раз и не пересоздаётся при переходе
 *    в третий такт, иначе анимация сборки запустилась бы заново поверх результата;
 * 3) честный разбор результата — сколько утечки закрыто, сколько остаётся и что остаток
 *    закрывает только техническая часть (мост к продаже, не обман).
 */
export function ChainScreen() {
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const leakCurrent = useFunnelStore(selectLeakCurrent);
  const closedPct = useFunnelStore(selectLeakClosedPct);
  const completeMechanic = useFunnelStore((s) => s.completeMechanic);
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const [scene, setScene] = useState<ScenePhase>('lead');
  const startedRef = useRef(false);
  const revealedRef = useRef(false);
  const data = getModuleChainData(spec);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const hold = reduced ? SCENE.leadHoldReducedMs : SCENE.leadHoldMs;
    const timer = window.setTimeout(() => setScene('chain'), hold);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  const handleChainComplete = () => {
    completeMechanic('module-chain');
    if (!revealedRef.current) {
      revealedRef.current = true;
      track('chain_reveal', { leakCurrent, closedPct });
    }
    setScene('result');
  };

  const handleContinue = () => {
    haptics.medium();
    next();
  };

  const chainStarted = scene !== 'lead';

  return (
    <Screen id="chain" phase="believe">
      <div className="grid gap-6 pt-2">
        <AnimatePresence mode="wait">
          {scene === 'lead' && (
            <motion.p
              key="lead"
              className="t-h1 text-ink"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut }}
            >
              {/* В брифе нет отдельной строки-подводки к сцене сборки — короткая авторская
                  фраза, готовящая к анимации, а не рекламный копирайт (навигационный текст). */}
              Три модуля уже закрыты. Смотри, как они стыкуются в страницу.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Единственный экземпляр ModuleChain — монтируется при входе во второй такт и живёт
            до конца экрана, включая финальный, чтобы не переигрывать сборку. Сцена без
            постороннего контента — никакой обёртки-панели вокруг реакции синтеза. */}
        {chainStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.12 : 0.24, ease: easeOut }}
          >
            <ModuleChain data={data} spec={spec} onComplete={handleChainComplete} />
          </motion.div>
        )}

        <AnimatePresence>
          {scene === 'result' && (
            <motion.div
              key="result"
              className="grid gap-6"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : SCENE.resultReveal, ease: easeOut }}
            >
              <div className="grid gap-3">
                <h1 className="t-display-l text-ink">{copy.title}</h1>
                <Prose>
                  {copy.body?.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </Prose>
                {copy.bullets && <Bullets items={copy.bullets} />}
              </div>

              {copy.quote && <Quote>{copy.quote}</Quote>}

              <div className="grid gap-2">
                <p className="t-label text-ink-faint">УТЕЧКА СЕЙЧАС · ₽ / МЕС</p>
                <Well>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                      <div className="text-rust">
                        <Readout value={leakCurrent} suffix="₽" size="lg" />
                      </div>
                      <div className="grid justify-items-end gap-0.5">
                        <Readout value={closedPct} suffix="%" size="sm" />
                        <span className="t-label text-ink-faint">закрыто модулями</span>
                      </div>
                    </div>
                    <p className="t-label text-ink-faint">ОЦЕНКА. НЕ ОБЕЩАНИЕ.</p>
                  </div>
                </Well>
                {/* Честный мост к продаже (PRODUCT.md §3.1) — авторская строка, отсутствующая
                    в src/content: остаток утечки закрывает только техническая часть практикума. */}
                <p className="t-body-s text-ink-muted">
                  Оставшиеся {100 - closedPct}% закрывает только техническая часть — она в
                  практикуме, а не в этом видео.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {scene === 'result' && (
        <BottomBar>
          <Button variant="primary" full onClick={handleContinue}>
            {copy.cta}
          </Button>
        </BottomBar>
      )}
    </Screen>
  );
}
