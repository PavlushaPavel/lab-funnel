import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useFunnelStore } from './store/funnel';
import { screenRegistry } from './router/registry';
import { setBackButton } from './lib/telegram';
import { Grain } from './ui/Grain';
import { ProgressRail } from './ui/ProgressRail';

/**
 * Шелл приложения: зерно + верхний рельс + анимированная область шага.
 * Экран каждого StepId подставляется из screenRegistry — следующие волны
 * заменяют записи реестра на реальные экраны, не трогая этот файл.
 */
export default function App() {
  const step = useFunnelStore((s) => s.step);
  const back = useFunnelStore((s) => s.back);
  const historyLength = useFunnelStore((s) => s.history.length);

  useEffect(() => {
    setBackButton(historyLength > 0, back);
  }, [historyLength, back]);

  const StepScreen = screenRegistry[step];

  return (
    <>
      <Grain />
      <ProgressRail />
      <AnimatePresence mode="wait" initial={false}>
        <StepScreen key={step} />
      </AnimatePresence>
    </>
  );
}
