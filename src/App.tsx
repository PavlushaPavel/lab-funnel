import { Suspense, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useFunnelStore } from './store/funnel';
import { screenRegistry, preloadStep } from './router/registry';
import { nextStep } from './router/flow';
import { setBackButton } from './lib/telegram';
import { scheduleIdle } from './lib/idle';
import { ProgressRail } from './ui/ProgressRail';
import { StepFallback } from './ui/StepFallback';

/**
 * Шелл приложения: верхний рельс + анимированная область шага.
 * Зерна и световых пятен в мире v3 нет (DESIGN.md §2.10).
 * Экран каждого StepId подставляется из screenRegistry — следующие волны
 * заменяют записи реестра на реальные экраны, не трогая этот файл.
 *
 * Экраны — React.lazy-чанки (features/registryA|B|C.ts), поэтому каждый StepScreen
 * оборачивается в Suspense. Воронка линейна (router/flow.ts), поэтому чанк следующего
 * шага прогревается заранее, в простое браузера — обычный переход «Дальше» не должен
 * упираться в загрузку (fallback у Suspense почти никогда не успевает показаться).
 */
export default function App() {
  const step = useFunnelStore((s) => s.step);
  const back = useFunnelStore((s) => s.back);
  const historyLength = useFunnelStore((s) => s.history.length);

  useEffect(() => {
    setBackButton(historyLength > 0, back);
  }, [historyLength, back]);

  useEffect(() => {
    const n = nextStep(step);
    if (!n) return;
    return scheduleIdle(() => preloadStep(n));
  }, [step]);

  const StepScreen = screenRegistry[step];

  return (
    <>
      <ProgressRail />
      <AnimatePresence mode="wait" initial={false}>
        <Suspense key={step} fallback={<StepFallback />}>
          <StepScreen />
        </Suspense>
      </AnimatePresence>
    </>
  );
}
