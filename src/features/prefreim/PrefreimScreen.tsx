import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { ArrowDown } from '@phosphor-icons/react';
import { Prose } from '../../ui/Prose';
import { Quote } from '../../ui/Quote';
import { Bullets } from '../../ui/Bullets';
import { Panel } from '../../ui/Panel';
import { Button } from '../../ui/Button';
import { Divider } from '../../ui/Divider';
import { NodeLabel } from '../../ui/NodeLabel';
import { Grain } from '../../ui/Grain';
import { easeOut, listItem, useReducedMotionSafe } from '../../lib/motion';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { useFunnelStore } from '../../store/funnel';
import { appRootPath } from '../../router/prefreimRoute';
import {
  META,
  INTRO,
  SECTION_1,
  SECTION_2,
  SECTION_3,
  SECTION_4,
  SECTION_5,
  SECTION_6,
  SECTION_7,
  PRICE_TEXT,
  CTA_LABEL,
} from './content';

/**
 * Локальные величины экрана-лонгрида. Пружины/базовые длительности — только из lib/motion.ts
 * (ARCHITECTURE.md §6, §11.3), но точечные настройки конкретного скролл-ридера собраны здесь
 * одним объектом, а не разбросаны магическими числами по JSX (по аналогии с IntroScreen.BOOT).
 */
const LOCAL = {
  progressBarHeight: 6, // px, тонкая полоса прогресса чтения сверху
  ctaFade: { duration: 0.2, ease: easeOut },
  revealViewport: { once: true, margin: '-72px 0px -8% 0px' }, // окно срабатывания reveal
} as const;

/** Абзацы с reveal-анимацией при попадании во вьюпорт: opacity+y, easeOut (DESIGN.md §8).
 * Сдержанно, без зацикливания, полностью отключается для prefers-reduced-motion (DESIGN.md §9). */
function RevealParagraphs({ paragraphs, reduced }: { paragraphs: string[]; reduced: boolean }) {
  return (
    <Prose>
      {paragraphs.map((p, i) =>
        reduced ? (
          <p key={i}>{p}</p>
        ) : (
          <motion.p
            key={i}
            variants={listItem}
            initial="hidden"
            whileInView="show"
            viewport={LOCAL.revealViewport}
          >
            {p}
          </motion.p>
        )
      )}
    </Prose>
  );
}

/** Выделяет цену сигнальным цветом внутри дословного абзаца из брифа. Текст не меняется —
 * только оборачивается участок строки, совпадающий с PRICE_TEXT, в моно-акцент. */
function withPriceHighlight(text: string) {
  const idx = text.indexOf(PRICE_TEXT);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-mono font-semibold text-signal tnum">{PRICE_TEXT}</span>
      {text.slice(idx + PRICE_TEXT.length)}
    </>
  );
}

/** Заголовок раздела: фирменная моно-маркировка узла «01 · ПРО ТЕБЯ» (DESIGN.md §6.2). */
function SectionHead({ code, title }: { code: string; title: string }) {
  return <NodeLabel code={code} title={title} status="active" />;
}

/**
 * Лонгрид-префрейм (`PrefreimScreen`) — закреплённый пост-лендинг вне основного потока
 * воронки (ARCHITECTURE.md §2). Режим Persuade (DESIGN.md §1): дизайн здесь и есть продукт —
 * задача экрана в том, чтобы длинный текст дочитали до конца и нажали единственную кнопку.
 *
 * Компонент — собственная точка входа (не рендерится внутри App.tsx), поэтому сам несёт Grain,
 * которую в остальном приложении ставит один раз App (DESIGN.md §6.5).
 */
export function PrefreimScreen() {
  const reduced = useReducedMotionSafe();
  const [ctaVisible, setCtaVisible] = useState(false);
  const heroSentinelRef = useRef<HTMLDivElement>(null);

  // Прогресс чтения — motionValue от скролла страницы, без useState на каждый кадр
  // (ARCHITECTURE.md §11.8). Значение идёт прямо в style дочернего motion.div.
  const { scrollYProgress } = useScroll();
  const fillWidth = useTransform(scrollYProgress, (v) => `${Math.round(v * 100)}%`);

  useEffect(() => {
    track('prefreim_view');
  }, []);

  // Липкая CTA появляется, когда первый экран (герой + начало интро) уходит из вьюпорта.
  useEffect(() => {
    const el = heroSentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCtaVisible(!entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleCta = () => {
    haptics.medium();
    // В контракте аналитики (ARCHITECTURE.md §5) нет отдельного события для клика по CTA
    // префрейма — ближайшее по смыслу существующее событие входа в оплачиваемую часть.
    track('checkout_click', { source: 'prefreim' });
    // Префрейм не входит в StepId-поток (router/flow.ts), поэтому явно ставим шаг воронки
    // на вход, прежде чем main.tsx на новой загрузке отрисует основной App.
    useFunnelStore.getState().go('intro');
    // Не жёсткий "/": base:'./' в vite.config.ts означает, что на GitHub Pages приложение
    // живёт в подкаталоге — appRootPath снимает сегмент "prefreim" с текущего пути, а не
    // предполагает корень домена, иначе после клика был бы белый экран/чужой сайт.
    window.location.assign(appRootPath(window.location.pathname));
  };

  return (
    <>
      <Grain />

      {/* Полоса прогресса чтения — визуальный язык TickRail (риски + сигнальная заливка),
          DESIGN.md §6.1. Полностью на motion-значении, без React-стейта на каждый кадр скролла. */}
      <div
        className="fixed inset-x-0 top-0 z-40 bg-void"
        style={{ height: LOCAL.progressBarHeight }}
        aria-hidden="true"
      >
        <div className="relative h-full w-full overflow-hidden">
          <div className="tick-rail-fill" style={{ ['--tick-color' as string]: 'var(--line)' }} />
          <motion.div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: fillWidth }}>
            <div className="tick-rail-fill" style={{ ['--tick-color' as string]: 'var(--signal)' }} />
          </motion.div>
        </div>
      </div>

      <main
        className="mx-auto grid max-w-(--app-max) gap-8 px-(--gutter)"
        style={{
          paddingTop: `calc(${LOCAL.progressBarHeight}px + max(var(--sp-5), env(safe-area-inset-top)))`,
          paddingBottom: 'calc(var(--bar-h) + var(--sp-7) + env(safe-area-inset-bottom))',
        }}
      >
        {/* ---- Герой ---- */}
        <header className="grid gap-4">
          <NodeLabel code={META.code} title={META.kicker} status="active" />
          <h1 className="t-display-xl text-ink">{META.title}</h1>
          <p className="t-h2 text-ink-muted">{META.subtitle}</p>
        </header>

        <RevealParagraphs paragraphs={INTRO.before} reduced={reduced} />
        <Bullets items={INTRO.list} />
        <RevealParagraphs paragraphs={INTRO.after} reduced={reduced} />

        {/* Граница первого экрана — после неё появляется липкая CTA. */}
        <div ref={heroSentinelRef} aria-hidden="true" />

        <Divider />

        {/* ---- 01 · ПРО ТЕБЯ ---- */}
        <section className="grid gap-4">
          <SectionHead code={SECTION_1.code} title={SECTION_1.title} />
          <RevealParagraphs paragraphs={SECTION_1.paragraphs} reduced={reduced} />
        </section>

        <Divider />

        {/* ---- 02 · ПРО ТО, КАК ТЫ ТЕРЯЕШЬ БАБКИ ---- */}
        <section className="grid gap-4">
          <SectionHead code={SECTION_2.code} title={SECTION_2.title} />
          <p className="t-body text-ink-muted">{SECTION_2.lead}</p>
          <div className="grid gap-5">
            {SECTION_2.variants.map((variant, i) => (
              <div key={i} className="grid gap-2">
                <span className="t-label text-signal">ВАРИАНТ {String(i + 1).padStart(2, '0')}</span>
                {reduced ? (
                  <Quote>{variant}</Quote>
                ) : (
                  <motion.div
                    variants={listItem}
                    initial="hidden"
                    whileInView="show"
                    viewport={LOCAL.revealViewport}
                  >
                    <Quote>{variant}</Quote>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* ---- 03 · ПРО ФОКУС — смысловой центр: рекламный кабинет vs вся система ---- */}
        <section className="grid gap-4">
          <SectionHead code={SECTION_3.code} title={SECTION_3.title} />
          <RevealParagraphs paragraphs={SECTION_3.paragraphs.slice(0, 3)} reduced={reduced} />

          <div className="grid gap-2">
            <Panel label="ТЫ ВИДИШЬ" status="locked">
              <p className="t-h2 text-ink-muted">Рекламный кабинет.</p>
            </Panel>

            <div className="grid justify-items-center py-1" aria-hidden="true">
              <ArrowDown weight="regular" size={18} color="var(--ink-faint)" />
            </div>

            <Panel label="КЛИЕНТ ОЦЕНИВАЕТ ВСЮ СИСТЕМУ" status="active">
              <ol className="grid">
                {SECTION_3.chain.map((step, i) => (
                  <li
                    key={step}
                    className="grid grid-cols-[28px_1fr] items-baseline gap-2 py-2"
                    style={i > 0 ? { borderTop: '1px solid var(--line)' } : undefined}
                  >
                    <span className="t-readout-s text-signal">{String(i + 1).padStart(2, '0')}</span>
                    <span className="t-body-s text-ink">{step}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>

          <RevealParagraphs paragraphs={SECTION_3.paragraphs.slice(3)} reduced={reduced} />
        </section>

        <Divider />

        {/* ---- 04 · ПРО НЕЙРОНКИ — переписка + 8 шагов отдельными визуальными блоками ---- */}
        <section className="grid gap-4">
          <SectionHead code={SECTION_4.code} title={SECTION_4.title} />
          <RevealParagraphs paragraphs={SECTION_4.before} reduced={reduced} />

          <div className="grid gap-2">
            <div className="grid justify-items-end gap-1">
              <span className="t-label">{SECTION_4.chat.author}</span>
              <p
                className="t-body-s text-ink"
                style={{
                  maxWidth: '85%',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 16px',
                  boxShadow: 'var(--shadow-panel-sheen)',
                }}
              >
                {SECTION_4.chat.query}
              </p>
            </div>
            <div className="grid justify-items-start gap-1">
              <span className="t-label">{SECTION_4.chat.replyAuthor}</span>
              <p
                className="t-body-s text-ink-muted"
                style={{
                  maxWidth: '85%',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 16px',
                  boxShadow: 'var(--shadow-panel-sheen)',
                }}
              >
                {SECTION_4.chat.reply}
              </p>
            </div>
          </div>

          <p className="t-h2 text-signal">{SECTION_4.punchline}</p>

          <RevealParagraphs paragraphs={SECTION_4.middle} reduced={reduced} />

          <Panel label="ПОСЛЕДОВАТЕЛЬНОСТЬ" status="active">
            <ol className="grid grid-cols-2 gap-x-4 gap-y-3">
              {SECTION_4.steps.map((step, i) => (
                <li key={step} className="grid grid-cols-[24px_1fr] items-baseline gap-2">
                  <span className="t-label text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                  <span className="t-body-s text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <RevealParagraphs paragraphs={SECTION_4.after} reduced={reduced} />
        </section>

        <Divider />

        {/* ---- 05 · ПРО ТО, ЧТО БУДЕТ ВНУТРИ — М-01 / М-02 / М-03 ---- */}
        <section className="grid gap-4">
          <SectionHead code={SECTION_5.code} title={SECTION_5.title} />
          <p className="t-body text-ink-muted">{SECTION_5.lead}</p>

          <div className="grid gap-3">
            {SECTION_5.modules.map((m) => (
              <Panel key={m.code} label={`${m.code} · ${m.title}`} status="active">
                <p className="t-label text-ink-faint">{m.ordinal}</p>
                <p className="t-body text-ink" style={{ marginTop: 6 }}>
                  {m.text}
                </p>
              </Panel>
            ))}
          </div>

          <RevealParagraphs paragraphs={SECTION_5.after} reduced={reduced} />
        </section>

        <Divider />

        {/* ---- 06 · ПРО ТО, ЧТО Я ТЕБЕ ПРОДАМ ---- */}
        <section className="grid gap-4">
          <SectionHead code={SECTION_6.code} title={SECTION_6.title} />
          <Prose>
            {SECTION_6.paragraphs.map((p, i) =>
              reduced ? (
                <p key={i}>{withPriceHighlight(p)}</p>
              ) : (
                <motion.p
                  key={i}
                  variants={listItem}
                  initial="hidden"
                  whileInView="show"
                  viewport={LOCAL.revealViewport}
                >
                  {withPriceHighlight(p)}
                </motion.p>
              )
            )}
          </Prose>
        </section>

        <Divider />

        {/* ---- 07 · ЧТО ТЕБЕ ДЕЛАТЬ ---- */}
        <section className="grid gap-4">
          <SectionHead code={SECTION_7.code} title={SECTION_7.title} />
          <p className="t-body text-ink-muted">{SECTION_7.lead}</p>

          <div className="grid gap-5">
            {SECTION_7.options.map((option, i) => (
              <div key={i} className="grid gap-2">
                <span className="t-label text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                {reduced ? (
                  <p className="t-body text-ink">{option}</p>
                ) : (
                  <motion.p
                    className="t-body text-ink"
                    variants={listItem}
                    initial="hidden"
                    whileInView="show"
                    viewport={LOCAL.revealViewport}
                  >
                    {option}
                  </motion.p>
                )}
              </div>
            ))}
          </div>

          <RevealParagraphs paragraphs={SECTION_7.after} reduced={reduced} />

          {/* Финальный акцент — последнее, что человек читает перед кнопкой. */}
          <div className="grid gap-1 py-4 text-center">
            {reduced ? (
              <>
                <p className="t-display-l text-ink">{SECTION_7.final[0]}</p>
                <p className="t-display-l text-signal">{SECTION_7.final[1]}</p>
              </>
            ) : (
              <>
                <motion.p
                  className="t-display-l text-ink"
                  variants={listItem}
                  initial="hidden"
                  whileInView="show"
                  viewport={LOCAL.revealViewport}
                >
                  {SECTION_7.final[0]}
                </motion.p>
                <motion.p
                  className="t-display-l text-signal"
                  variants={listItem}
                  initial="hidden"
                  whileInView="show"
                  viewport={LOCAL.revealViewport}
                  transition={{ delay: 0.06 }}
                >
                  {SECTION_7.final[1]}
                </motion.p>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Липкая нижняя CTA — появляется после прокрутки первого экрана. Fixed, а не sticky:
          ui/BottomBar рассчитан на одноэкранные шаги воронки (min-h-dvh), а здесь длинный
          скролл-документ, поэтому панель собрана локально с тем же визуальным контрактом
          (граница, bg-void, safe-area), но position: fixed. Монтируется/размонтируется через
          AnimatePresence — так скрытая кнопка не остаётся в таб-порядке и не перехватывает тапы. */}
      <AnimatePresence>
        {ctaVisible && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-void"
            style={{ paddingBottom: 'max(var(--sp-4), env(safe-area-inset-bottom))' }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={LOCAL.ctaFade}
          >
            <div
              className="mx-auto grid max-w-(--app-max) gap-2 px-(--gutter) pt-3"
              style={{ minHeight: 'var(--bar-h)' }}
            >
              <Button variant="primary" full onClick={handleCta}>
                {CTA_LABEL}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
