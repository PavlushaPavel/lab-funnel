import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { SCREENS } from '../../content/screens';
import { useFunnelStore } from '../../store/funnel';
import { listStagger, listItem, springPanel, useReducedMotionSafe } from '../../lib/motion';
import { haptics } from '../../lib/telegram';

const copy = SCREENS.intro;

/**
 * Мера строки дисплейного заголовка (DESIGN.md §4: дисплей до 14ch, чтобы ломаться
 * на 3–4 плотные строки). Берём 12 — так заголовок интро встаёт тремя строками.
 */
const DISPLAY_MEASURE_CH = 12;

/**
 * Раскладка заголовка по строкам без изменения текста: жадно набираем слова,
 * пока строка не превысила меру. Нужна для маски по строкам (§7) — единственного
 * разрешённого дисплейного эффекта: анимировать можно только то, что разбито на строки.
 */
function splitToLines(text: string, measure: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    if (!current) {
      current = word;
      continue;
    }
    if (current.length + 1 + word.length <= measure) {
      current = `${current} ${word}`;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

/** Строка заголовка выезжает из-под маски (§7). Пружина — springPanel, без магических чисел. */
const lineMask: Variants = {
  hidden: { y: '110%' },
  show: { y: '0%', transition: springPanel },
};

/**
 * Первый экран продукта (DESIGN.md v3): редакционный вход, а не «бут прибора».
 * Приборной калибровочной шкалы и маркировки узла в этом мире нет — они были из тёмного v2.
 * Всю работу делает типографика: массивный заглавный заголовок проявляется построчно
 * (маска по строкам, §7), затем спокойный текст, затем кнопка. Порядок задаёт один
 * stagger-контейнер на 40ms, поэтому локальных задержек-магических чисел здесь нет.
 */
export function IntroScreen() {
  const next = useFunnelStore((s) => s.next);
  const reduced = useReducedMotionSafe();

  const titleLines = splitToLines(copy.title, DISPLAY_MEASURE_CH);

  const handleStart = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="intro" phase="know">
      <motion.div
        className="grid gap-6"
        variants={reduced ? undefined : listStagger}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'show'}
      >
        <h1 className="t-display-xl text-ink" aria-label={copy.title}>
          {titleLines.map((line, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="block overflow-hidden"
              // Маска режет строку по базовой линии, поэтому выносные элементы
              // (р, у, б) нужно вернуть внутрь кадра — оптическая правка в em.
              style={{ paddingBottom: '0.08em', marginBottom: '-0.08em' }}
            >
              <motion.span className="block" variants={reduced ? undefined : lineMask}>
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div className="grid gap-3" variants={reduced ? undefined : listItem}>
          {copy.body?.map((paragraph, i) => (
            <p key={i} className="t-body text-ink-secondary">
              {paragraph}
            </p>
          ))}
        </motion.div>

        <BottomBar>
          <motion.div variants={reduced ? undefined : listItem}>
            <Button variant="primary" full onClick={handleStart}>
              {copy.cta}
            </Button>
          </motion.div>
        </BottomBar>
      </motion.div>
    </Screen>
  );
}
