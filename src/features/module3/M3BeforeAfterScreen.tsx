import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { NodeLabel } from '../../ui/NodeLabel';
import { Bullets } from '../../ui/Bullets';
import { Quote } from '../../ui/Quote';
import { Prose } from '../../ui/Prose';
import { Choice } from '../../ui/Choice';
import { BeforeAfter } from '../../mechanics/BeforeAfter';
import { TraceChain } from '../../mechanics/TraceChain';
import { getBeforeAfterData, getTraceChainData } from '../../content/mechanics';
import { MODULES } from '../../content/modules';
import { SCREENS } from '../../content/screens';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';

const module3 = MODULES.m3;
const copy = SCREENS['m3-beforeafter'];

/**
 * Механика «До / после» (`m3-beforeafter`, PRODUCT.md §4.3) — доказательство, что страница
 * собралась из работы модулей 1 и 2, а не из воздуха. Механика сама не переключает шаг
 * (ARCHITECTURE.md §9) — экран слушает onComplete, фиксирует mechanic_complete и только
 * тогда открывает `TraceChain` (PRODUCT.md §4.4) — сквозную трассировку одной ситуации через
 * ситуацию/запрос/объявление/первый экран, профессиональную кульминацию модуля 3.
 *
 * Это единственная реальная работа модуля 3 (у m1/m2 её роль играет практика с ассистентом) —
 * поэтому модуль засчитывается пройденным (`completeModule`) сразу после `BeforeAfter`,
 * а не на m3-code при вводе кода (ARCHITECTURE.md §3): код открывает доступ, а не результат.
 * `TraceChain` идёт следом чисто по показу — модуль уже засчитан, это финальный вывод, а не
 * ещё одно условие.
 *
 * После TraceChain раскрывается «Крышеснос» (BRIEF.md §14, часть 8) — авторский текст-итог
 * всего пути модулей 1–3. Раньше жил на снесённом экране `chain` (сборка цепочки, ModuleChain):
 * анимация синтеза была игровым слоем поверх контента, а не самим контентом. Текст перенесён
 * дословно, без единого слова правки. Порядок экрана: человек сам разобрал до/после →
 * видит сквозную трассировку → читает авторский вывод.
 */
export function M3BeforeAfterScreen() {
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const completeMechanic = useFunnelStore((s) => s.completeMechanic);
  const completeModule = useFunnelStore((s) => s.completeModule);
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const [done, setDone] = useState(false);
  const [traced, setTraced] = useState(false);
  // Реальная работа модуля 3: человек не просто пролистал маркеры, а выбрал три изменения,
  // которые считает решающими. Модуль засчитывается только после этого выбора.
  const [picked, setPicked] = useState<string[]>([]);
  const data = getBeforeAfterData(spec);
  const traceData = getTraceChainData(spec);
  const setPracticeInput = useFunnelStore((s) => s.setPracticeInput);

  const PICK_TARGET = 3;
  const pickedEnough = picked.length >= PICK_TARGET;

  const handleComplete = () => {
    completeMechanic('before-after');
    track('mechanic_complete', { mechanic: 'before-after' });
    haptics.success();
    setDone(true);
  };

  const togglePick = (id: string) => {
    if (pickedEnough && !picked.includes(id)) return;
    haptics.light();
    setPicked((prev) => {
      const nextPicked = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (nextPicked.length === PICK_TARGET) {
        setPracticeInput('m3-changes', nextPicked.join(','));
        completeModule('m3');
        track('practice_complete', { module: 'm3', picked: nextPicked });
        haptics.success();
      }
      return nextPicked;
    });
  };

  const handleTraceComplete = () => {
    completeMechanic('trace-chain');
    track('mechanic_complete', { mechanic: 'trace-chain' });
    setTraced(true);
  };

  const handleContinue = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="m3-beforeafter" phase="believe">
      <div className="grid gap-6 pt-2">
        <NodeLabel code={module3.code} title={module3.title} status="active" />

        {/* Механика сама несёт свои поверхности (белая карточка / мятная отметка), поэтому
            обёртки-панели вокруг неё нет: карточка в карточке в плоском мире читается как шум. */}
        <BeforeAfter data={data} spec={spec} onComplete={handleComplete} />

        <AnimatePresence>
          {done && (
            <motion.div
              className="grid gap-3"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut }}
            >
              <p className="t-body text-ink">
                Отметь три изменения, которые сильнее всего повлияют на заявки.
              </p>
              <div className="grid gap-2">
                {data.markers.map((marker, i) => (
                  <Choice
                    key={marker.id}
                    index={i}
                    state={picked.includes(marker.id) ? 'selected' : 'idle'}
                    onSelect={() => togglePick(marker.id)}
                  >
                    {marker.note}
                  </Choice>
                ))}
              </div>
              <p className="t-caption tabular-nums">
                Выбрано {picked.length} из {PICK_TARGET}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pickedEnough && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut }}
            >
              <TraceChain data={traceData} spec={spec} onComplete={handleTraceComplete} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {traced && (
            <motion.div
              className="grid gap-4"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.3, ease: easeOut }}
            >
              <div className="grid gap-3">
                <h1 className="t-display text-ink">{copy.title}</h1>
                <Prose>
                  {copy.body?.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </Prose>
                {copy.bullets && <Bullets items={copy.bullets} />}
              </div>
              {copy.quote && <Quote>{copy.quote}</Quote>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomBar>
        <Button variant="primary" full disabled={!traced} onClick={handleContinue}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
