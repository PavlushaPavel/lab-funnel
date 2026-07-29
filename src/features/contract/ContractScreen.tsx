import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { Prose } from '../../ui/Prose';
import { VideoBlock } from '../../ui/VideoBlock';
import { SCREENS } from '../../content/screens';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { cn } from '../../lib/cn';
import { springSnappy, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS.contract;
// В содержимом src/content/video.ts ролик контракта живёт под ключом 'contract' (не 'contract-video',
// как указано в постановке задачи) — используется реальный ключ, иначе VideoBlock отрисует
// TODO-заглушку вместо настоящего постера/хронометража ролика.
const VIDEO_ID = 'contract';

interface DistrustClause {
  id: string;
  text: string;
}

/**
 * Пункты расписки — дословно из BRIEF.md §5 «Содержание видео»: «Не верь мне на слово. Вообще.
 * Проверяй каждый шаг. Гугли. Спрашивай ChatGPT. Спрашивай других специалистов. Докапывайся.
 * Относись ко всему так, будто я хочу тебе что-то продать, а ты покупать не собираешься.
 * Прям сопротивляйся.» Разбито на 4 отдельных пункта — так же, как их перечисляет автор
 * по смыслу (не верить / проверять / докапываться / сопротивляться), без пересказа и без
 * добавленных слов.
 */
const CLAUSES: DistrustClause[] = [
  { id: 'no-word', text: 'Не верь мне на слово. Вообще.' },
  { id: 'verify', text: 'Проверяй каждый шаг. Гугли. Спрашивай ChatGPT. Спрашивай других специалистов.' },
  { id: 'dig', text: 'Докапывайся.' },
  {
    id: 'resist',
    text: 'Относись ко всему так, будто я хочу тебе что-то продать, а ты покупать не собираешься. Прям сопротивляйся.',
  },
];

/**
 * Контракт недоверия (`contract`) — вход в фазу ХОЧУ. Вместо текста-обещания автора человек
 * сам принимает условие проверять: тапает по пунктам расписки, и только когда все приняты,
 * открывается кнопка «Не верю. Продолжай» (PRODUCT.md §4-БИС, DESIGN.md §2.2).
 * Самый спокойный экран приложения: максимум воздуха, минимум декора, кислотный цвет —
 * только на кнопке и на отметках принятых пунктов (DESIGN.md §1, §3).
 */
export function ContractScreen() {
  const setVideoProgress = useFunnelStore((s) => s.setVideoProgress);
  const next = useFunnelStore((s) => s.next);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const reduced = useReducedMotionSafe();

  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const allAccepted = CLAUSES.every((c) => accepted[c.id]);

  const handleProgress = (p: number) => {
    setVideoProgress(VIDEO_ID, p);
    if (!startedRef.current && p > 0) {
      startedRef.current = true;
      track('video_start', { videoId: VIDEO_ID });
    }
    if (!completedRef.current && p >= 0.999) {
      completedRef.current = true;
      track('video_complete', { videoId: VIDEO_ID });
    }
  };

  const toggleClause = (id: string) => {
    haptics.select();
    setAccepted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContinue = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="contract" phase="want">
      <div className="grid gap-8 pt-2">
        <div className="grid gap-3">
          <h1 className="t-display-l text-ink">{copy.title}</h1>
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>

        <VideoBlock id={VIDEO_ID} onProgress={handleProgress} />

        <Panel label="РАСПИСКА" status={allAccepted ? 'done' : 'locked'}>
          <div className="grid gap-2">
            {CLAUSES.map((clause) => {
              const checked = Boolean(accepted[clause.id]);
              return (
                <button
                  key={clause.id}
                  type="button"
                  onClick={() => toggleClause(clause.id)}
                  aria-pressed={checked}
                  className={cn(
                    'grid min-h-11 w-full grid-cols-[24px_1fr] items-start gap-3 rounded-md border px-3 py-3 text-left'
                  )}
                  style={{
                    borderColor: checked ? 'var(--line-acid)' : 'var(--line)',
                    backgroundColor: checked ? 'var(--acid-dim)' : 'transparent',
                  }}
                >
                  <span
                    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border"
                    style={{
                      borderColor: checked ? 'var(--acid)' : 'var(--line-strong)',
                      backgroundColor: checked ? 'var(--acid-dim)' : 'transparent',
                    }}
                    aria-hidden="true"
                  >
                    {checked && (
                      <motion.span
                        initial={reduced ? undefined : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={reduced ? { duration: 0 } : springSnappy}
                        className="grid place-items-center"
                      >
                        <Check weight="bold" size={13} color="var(--acid)" />
                      </motion.span>
                    )}
                  </span>
                  <span className="t-body-s text-ink">{clause.text}</span>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <BottomBar>
        <Button variant="primary" full disabled={!allAccepted} onClick={handleContinue}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
