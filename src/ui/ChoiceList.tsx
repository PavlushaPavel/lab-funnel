import { motion } from 'motion/react';
import { Choice } from './Choice';
import { listStagger, listItem, useReducedMotionSafe } from '../lib/motion';

interface ChoiceOption {
  id: string;
  label: string;
}

interface ChoiceListProps {
  options: ChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  revealCorrect?: string;
}

/** Список вариантов ответа со stagger-появлением (DESIGN.md §8). */
export function ChoiceList({ options, value, onChange, revealCorrect }: ChoiceListProps) {
  const reduced = useReducedMotionSafe();

  return (
    <motion.div
      className="grid gap-2"
      variants={reduced ? undefined : listStagger}
      initial={reduced ? undefined : 'hidden'}
      animate={reduced ? undefined : 'show'}
    >
      {options.map((option, index) => {
        const state = revealCorrect
          ? option.id === revealCorrect
            ? 'correct'
            : option.id === value
              ? 'wrong'
              : 'idle'
          : option.id === value
            ? 'selected'
            : 'idle';

        return (
          <motion.div key={option.id} variants={reduced ? undefined : listItem}>
            <Choice index={index} state={state} onSelect={() => onChange(option.id)}>
              {option.label}
            </Choice>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
