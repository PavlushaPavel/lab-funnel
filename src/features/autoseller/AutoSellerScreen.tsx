import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Bullets } from '../../ui/Bullets';
import {
  AUTOSELLER_INTRO,
  AUTOSELLER_BRANCHES,
  AUTOSELLER_CLOSING,
  AUTOSELLER_EXAMPLES,
  FIT_BY_SPEC,
} from '../../content/autoseller';
import type { AutoSellerBranch } from '../../content/types';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics, openLink } from '../../lib/telegram';
import { cn } from '../../lib/cn';
import { listItem, useReducedMotionSafe } from '../../lib/motion';

/**
 * Темп чата — не CSS-анимация и не пружина (те по-прежнему только из lib/motion.ts), а
 * симуляция набора текста, ровно как VideoBlock.tsx симулирует прогресс просмотра своим
 * локальным tickMs. Живёт здесь же, одним объектом, а не магическими числами по коду.
 */
const PACE = {
  typingMs: 650, // сколько «печатает» перед каждой репликой
  gapMs: 220, // пауза между репликами одного сообщения бота
} as const;

interface OptionChoice {
  id: string;
  label: string;
  action?: 'checkout' | 'branch' | 'menu';
  targetId?: string;
}

type ThreadItem =
  | { kind: 'bot'; id: string; text: string }
  | { kind: 'user'; id: string; text: string }
  | { kind: 'bullets'; id: string; items: string[] }
  | { kind: 'fit'; id: string; text: string }
  | { kind: 'examples'; id: string }
  | { kind: 'options'; id: string; mode: 'root' | 'followup'; options: OptionChoice[]; answered?: string }
  | { kind: 'cta'; id: string; label: string };

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Появление элемента ленты (DESIGN.md §7): только opacity + короткий y 8px, длительность и
 * easing — из lib/motion.ts. Анимация играет один раз, на монтировании: ключи элементов ленты
 * стабильны, поэтому старые сообщения не переигрываются при добавлении нового.
 */
function ChatRow({
  children,
  className,
  reduced,
}: {
  children: ReactNode;
  className?: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : listItem}
      initial={reduced ? { opacity: 0 } : 'hidden'}
      animate={reduced ? { opacity: 1 } : 'show'}
      transition={reduced ? { duration: 0.12 } : undefined}
    >
      {children}
    </motion.div>
  );
}

/** Реплика автопродавца слева — белая карточка на холсте (DESIGN.md §6 Карточка). */
function BotBubble({ text }: { text: string }) {
  return (
    <div className="bg-card rounded-card mr-auto max-w-[85%] p-(--sp-2)">
      <p className="t-body text-ink">{text}</p>
    </div>
  );
}

/** Индикатор набора: три точки, единственная разрешённая доп. зацикленная анимация (ТЗ волны). */
function TypingDots() {
  return (
    <div className="bg-card rounded-card mr-auto p-(--sp-2)">
      <div className="flex items-center gap-1" role="status" aria-label="Автопродавец печатает">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="anim-pulse-warn h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--ink-muted)', animationDelay: `${i * 0.15}s` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

function ExamplesBlock({ onOpen }: { onOpen: (url: string) => void }) {
  return (
    <div className="mr-auto grid w-full max-w-[95%] grid-cols-2 gap-2">
      {AUTOSELLER_EXAMPLES.map((ex) => (
        <button
          key={ex.id}
          type="button"
          disabled={!ex.url}
          onClick={() => ex.url && onOpen(ex.url)}
          className={cn(
            'rounded-card grid min-h-11 items-center gap-1 p-(--sp-2) text-left',
            ex.url ? 'bg-card text-ink' : 'bg-mist text-ink-muted'
          )}
        >
          <span className="t-body-sm">{ex.label}</span>
          {ex.url ? (
            <span className="t-caption inline-flex items-center gap-1">
              ОТКРЫТЬ
              <ArrowSquareOut weight="regular" size={12} aria-hidden="true" />
            </span>
          ) : (
            <span className="t-caption">TODO: ССЫЛКА СКОРО</span>
          )}
        </button>
      ))}
    </div>
  );
}

function OptionsBlock({
  item,
  onPick,
}: {
  item: Extract<ThreadItem, { kind: 'options' }>;
  onPick: (item: Extract<ThreadItem, { kind: 'options' }>, option: OptionChoice) => void;
}) {
  const isAnswered = item.answered !== undefined;
  return (
    <div className="mr-auto grid w-full max-w-[95%] gap-2">
      {item.options.map((option) => {
        const isChosen = item.answered === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={isAnswered}
            onClick={() => onPick(item, option)}
            className={cn(
              't-body-sm rounded-card grid min-h-11 items-center px-4 py-3 text-left',
              // Отмеченный выбор — мята, остальное белая карточка (DESIGN.md §6 Вариант ответа).
              isChosen ? 'bg-mint text-ink' : 'bg-card text-ink',
              isAnswered && !isChosen && 'opacity-40'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Автопродавец (`autoseller`, PRODUCT.md §4.6, BRIEF.md §18–19). Чат-раскладка отличается
 * от типовой Screen+статический контент: тело экрана — растущая лента сообщений, а не
 * фиксированный блок, поэтому BottomBar здесь несёт не разовую CTA, а ПОСТОЯННУЮ, но
 * подчёркнуто ненавязчивую (secondary, не сигнальная) кнопку оплаты — громкая primary-кнопка
 * появляется только один раз, инлайн в ленте, ровно в момент «вопрос закрыл» (BRIEF.md §19).
 */
export function AutoSellerScreen() {
  const spec = useFunnelStore((s) => s.spec) ?? 'unknown';
  const go = useFunnelStore((s) => s.go);
  const reduced = useReducedMotionSafe();

  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [typing, setTyping] = useState(false);
  const idRef = useRef(0);
  const busyRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const nid = () => `t${idRef.current++}`;
  const push = (item: ThreadItem) => setThread((t) => [...t, item]);
  const markAnswered = (itemId: string, optionId: string) =>
    setThread((t) => t.map((it) => (it.kind === 'options' && it.id === itemId ? { ...it, answered: optionId } : it)));

  async function typeBot(lines: string[]) {
    for (const line of lines) {
      setTyping(true);
      await wait(PACE.typingMs);
      setTyping(false);
      push({ kind: 'bot', id: nid(), text: line });
      await wait(PACE.gapMs);
    }
  }

  async function runBranch(branch: AutoSellerBranch) {
    if (branch.id === 'is-it-for-me') {
      // Персонализация под текущую специализацию вместо полного списка по всем ролям (ТЗ волны).
      push({ kind: 'fit', id: nid(), text: FIT_BY_SPEC[spec] });
      await wait(PACE.gapMs);
      await typeBot(branch.messages);
    } else if (branch.id === 'show-examples' && branch.messages.length >= 2) {
      await typeBot([branch.messages[0]]);
      push({ kind: 'examples', id: nid() });
      await wait(PACE.gapMs);
      await typeBot(branch.messages.slice(1));
    } else {
      await typeBot(branch.messages);
      if (branch.bullets) push({ kind: 'bullets', id: nid(), items: branch.bullets });
    }
    push({ kind: 'options', id: nid(), mode: 'followup', options: branch.followUp });
  }

  async function selectRootOption(itemId: string, option: OptionChoice) {
    if (busyRef.current) return;
    busyRef.current = true;
    haptics.light();
    markAnswered(itemId, option.id);
    push({ kind: 'user', id: nid(), text: option.label });
    track('objection_select', { branchId: option.id });
    const branch = AUTOSELLER_BRANCHES.find((b) => b.id === option.id);
    if (branch) await runBranch(branch);
    busyRef.current = false;
  }

  async function selectFollowUp(itemId: string, option: OptionChoice) {
    if (busyRef.current) return;
    busyRef.current = true;
    haptics.light();
    markAnswered(itemId, option.id);
    push({ kind: 'user', id: nid(), text: option.label });
    if (option.action === 'checkout') {
      await typeBot([AUTOSELLER_CLOSING.yes.message]);
      push({ kind: 'cta', id: nid(), label: AUTOSELLER_CLOSING.yes.cta });
    } else if (option.action === 'branch' && option.targetId) {
      // Углубление в конкретную под-ветку (напр. «Хочу подробнее» у «Что будет внутри?»).
      const target = AUTOSELLER_BRANCHES.find((b) => b.id === option.targetId);
      if (target) {
        await runBranch(target);
      } else {
        // targetId указывает в никуда — откатываемся к общему меню, не роняя сценарий.
        await typeBot([AUTOSELLER_CLOSING.no.message]);
        push({ kind: 'options', id: nid(), mode: 'root', options: AUTOSELLER_INTRO.options });
      }
    } else {
      // 'menu' и 'branch' без targetId (углубляться действительно некуда по брифу) — оба
      // возвращают к общему меню возражений, с общей репликой возврата из BRIEF.md §19.
      await typeBot([AUTOSELLER_CLOSING.no.message]);
      push({ kind: 'options', id: nid(), mode: 'root', options: AUTOSELLER_INTRO.options });
    }
    busyRef.current = false;
  }

  const handlePick = (item: Extract<ThreadItem, { kind: 'options' }>, option: OptionChoice) => {
    if (item.mode === 'root') void selectRootOption(item.id, option);
    else void selectFollowUp(item.id, option);
  };

  const handleOpenExample = (url: string) => {
    haptics.light();
    openLink(url);
  };

  const handleCheckout = () => {
    haptics.medium();
    track('checkout_click');
    go('checkout');
  };

  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    track('autoseller_open');
    let cancelled = false;
    (async () => {
      await typeBot(AUTOSELLER_INTRO.messages);
      if (cancelled) return;
      push({ kind: 'options', id: nid(), mode: 'root', options: AUTOSELLER_INTRO.options });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- сценарий стартует ровно один раз
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'end' });
  }, [thread, typing, reduced]);

  return (
    <Screen id="autoseller" phase="pay">
      <div className="grid gap-3 pt-2">
        {thread.map((item) => {
          switch (item.kind) {
            case 'bot':
              return (
                <ChatRow key={item.id} reduced={reduced}>
                  <BotBubble text={item.text} />
                </ChatRow>
              );
            case 'user':
              return (
                <ChatRow key={item.id} reduced={reduced} className="ml-auto w-fit max-w-[85%]">
                  <Chip active>{item.text}</Chip>
                </ChatRow>
              );
            case 'bullets':
              return (
                <ChatRow key={item.id} reduced={reduced} className="mr-auto max-w-[90%]">
                  <div className="bg-card rounded-card p-(--sp-2)">
                    <Bullets items={item.items} />
                  </div>
                </ChatRow>
              );
            case 'fit':
              return (
                <ChatRow key={item.id} reduced={reduced} className="mr-auto max-w-[90%]">
                  <div className="bg-card rounded-card grid gap-2 p-(--sp-2)">
                    <p className="t-caption">ПОД ТВОЮ СПЕЦИАЛИЗАЦИЮ</p>
                    <p className="t-body text-ink">{item.text}</p>
                  </div>
                </ChatRow>
              );
            case 'examples':
              return (
                <ChatRow key={item.id} reduced={reduced}>
                  <ExamplesBlock onOpen={handleOpenExample} />
                </ChatRow>
              );
            case 'options':
              return (
                <ChatRow key={item.id} reduced={reduced}>
                  <OptionsBlock item={item} onPick={handlePick} />
                </ChatRow>
              );
            case 'cta':
              return (
                <ChatRow key={item.id} reduced={reduced} className="mr-auto w-full">
                  <Button variant="primary" full onClick={handleCheckout}>
                    {item.label}
                  </Button>
                </ChatRow>
              );
            default:
              return null;
          }
        })}
        {typing && <TypingDots />}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      <BottomBar>
        <Button variant="secondary" full onClick={handleCheckout}>
          {AUTOSELLER_CLOSING.yes.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
