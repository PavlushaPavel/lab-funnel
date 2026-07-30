import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { ArrowDown } from '@phosphor-icons/react';
import { Prose } from '../../ui/Prose';
import { Quote } from '../../ui/Quote';
import { Bullets } from '../../ui/Bullets';
import { Button } from '../../ui/Button';
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
 * одним объектом, а не разбросаны магическими числами по JSX.
 */
const LOCAL = {
  progressBarHeight: 3, // px, плоская линия прогресса чтения сверху (DESIGN.md §6 ProgressRail)
  ctaFade: { duration: 0.2, ease: easeOut },
  revealViewport: { once: true, margin: '-72px 0px -8% 0px' }, // окно срабатывания reveal
  finalLineDelay: 0.06, // сдвиг второй строки финального акцента, с
} as const;

/** Двузначная моно-нумерация — техническая аннотация системы (DESIGN.md §6). */
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Разделитель разделов — волосяная линия --hairline (DESIGN.md §3), без калибровочных шкал. */
const RULE = '1px solid var(--hairline)';

/** Абзацы с reveal при скролле: только opacity + y 8px (DESIGN.md §7), полностью снимается
 * при prefers-reduced-motion. */
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

/** Выделяет цену микроакцентом --voltage внутри дословного абзаца из брифа. Текст не меняется —
 * только участок строки, совпадающий с PRICE_TEXT, получает подсветку словом (DESIGN.md §3).
 * Это единственное место всего экрана, где --voltage применён. */
function withPriceHighlight(text: string) {
  const idx = text.indexOf(PRICE_TEXT);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span
        className="tnum"
        style={{
          background: 'var(--voltage)',
          color: 'var(--ink)',
          padding: '0 4px',
          whiteSpace: 'nowrap',
        }}
      >
        {PRICE_TEXT}
      </span>
      {text.slice(idx + PRICE_TEXT.length)}
    </>
  );
}

/** Белая карточка контента с моно-лейблом. Локальная, чтобы схемы и списки лонгрида читались
 * как редакционные блоки, без статус-точек и приборных метафор (DESIGN.md §6). */
function Card({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 rounded-card bg-card p-(--card-pad)">
      {label && <span className="t-caption">{label}</span>}
      {children}
    </div>
  );
}

/** Шапка раздела: моно-номер + заглавный заголовок (DESIGN.md §4). */
function SectionHead({ code, title }: { code: string; title: string }) {
  return (
    <div className="grid gap-2">
      <span className="t-caption tnum">{code}</span>
      <h2 className="t-heading-lg text-ink">{title}</h2>
    </div>
  );
}

/** Раздел лонгрида: разделитель --hairline сверху, дальше вертикальный ритм внутри. */
function Section({ code, title, children }: { code: string; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-(--sp-3) pt-(--sp-3)" style={{ borderTop: RULE }}>
      <SectionHead code={code} title={title} />
      {children}
    </section>
  );
}

/**
 * Лонгрид-префрейм (`PrefreimScreen`) — закреплённый пост-лендинг вне основного потока
 * воронки (ARCHITECTURE.md §2). Самый типографический экран проекта: брутально-редакционный
 * язык v3 раскрывается здесь полностью — гигантский сжатый заголовок над спокойным текстом
 * 16px, моно-нумерация разделов, волосяные разделители, белые карточки на сером холсте.
 * Ни одной тени, ни одного градиента (DESIGN.md §2.1, §2.2). Копирайт дословный.
 *
 * Компонент — собственная точка входа (не рендерится внутри App.tsx).
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
      {/* Прогресс чтения — плоская линия: трек --hairline, заливка --ink (DESIGN.md §6).
          Полностью на motion-значении, без React-стейта на каждый кадр скролла. */}
      <div
        className="fixed inset-x-0 top-0 z-40"
        style={{ height: LOCAL.progressBarHeight, background: 'var(--hairline)' }}
        aria-hidden="true"
      >
        <motion.div className="h-full bg-ink" style={{ width: fillWidth }} />
      </div>

      <main
        className="mx-auto grid max-w-(--app-max) gap-(--section-gap) px-(--gutter)"
        style={{
          paddingTop: `calc(${LOCAL.progressBarHeight}px + max(var(--sp-5), env(safe-area-inset-top)))`,
          paddingBottom: 'calc(var(--bar-h) + var(--sp-4) + env(safe-area-inset-bottom))',
        }}
      >
        {/* ---- Герой: витрина всего стиля. Один дисплейный заголовок на экран (DESIGN.md §4). ---- */}
        <header className="grid gap-(--sp-2)">
          <span className="t-caption">
            {META.code} · {META.kicker}
          </span>
          <h1 className="t-display-xl text-ink">{META.title}</h1>
          <p className="t-subheading text-ink-secondary">{META.subtitle}</p>
        </header>

        <div className="grid gap-(--sp-3)">
          <RevealParagraphs paragraphs={INTRO.before} reduced={reduced} />
          <Bullets items={INTRO.list} />
          <RevealParagraphs paragraphs={INTRO.after} reduced={reduced} />
          {/* Граница первого экрана — после неё появляется липкая CTA. */}
          <div ref={heroSentinelRef} aria-hidden="true" />
        </div>

        {/* ---- 01 · ПРО ТЕБЯ ---- */}
        <Section code={SECTION_1.code} title={SECTION_1.title}>
          <RevealParagraphs paragraphs={SECTION_1.paragraphs} reduced={reduced} />
        </Section>

        {/* ---- 02 · ПРО ТО, КАК ТЫ ТЕРЯЕШЬ БАБКИ ---- */}
        <Section code={SECTION_2.code} title={SECTION_2.title}>
          <p className="t-body text-ink-secondary">{SECTION_2.lead}</p>
          <div className="grid gap-(--sp-3)">
            {SECTION_2.variants.map((variant, i) => (
              <div key={i} className="grid gap-2">
                <span className="t-caption tnum">ВАРИАНТ {pad2(i + 1)}</span>
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
        </Section>

        {/* ---- 03 · ПРО ФОКУС — смысловой центр: рекламный кабинет vs вся система ---- */}
        <Section code={SECTION_3.code} title={SECTION_3.title}>
          <RevealParagraphs paragraphs={SECTION_3.paragraphs.slice(0, 3)} reduced={reduced} />

          {/* Схема-контраст: две белые карточки и стрелка между ними. Никаких приборных
              метафор — только контраст поверхностей и типографика. */}
          <div className="grid gap-2">
            <Card label="ТЫ ВИДИШЬ">
              <p className="t-subheading text-ink-secondary">Рекламный кабинет.</p>
            </Card>

            <div className="grid justify-items-center" aria-hidden="true">
              <ArrowDown weight="regular" size={18} color="var(--ink-muted)" />
            </div>

            <Card label="КЛИЕНТ ОЦЕНИВАЕТ ВСЮ СИСТЕМУ">
              <ol className="grid">
                {SECTION_3.chain.map((step, i) => (
                  <li
                    key={step}
                    className="grid grid-cols-[28px_1fr] items-baseline gap-2 py-2"
                    style={i > 0 ? { borderTop: RULE } : undefined}
                  >
                    <span className="t-caption tnum text-ink">{pad2(i + 1)}</span>
                    <span className="t-body-sm text-ink">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <RevealParagraphs paragraphs={SECTION_3.paragraphs.slice(3)} reduced={reduced} />
        </Section>

        {/* ---- 04 · ПРО НЕЙРОНКИ — диалог двумя карточками-репликами + 8 шагов ---- */}
        <Section code={SECTION_4.code} title={SECTION_4.title}>
          <RevealParagraphs paragraphs={SECTION_4.before} reduced={reduced} />

          {/* Диалог: вопрос на белой карточке, тупой ответ — на тихой подложке --mist. */}
          <div className="grid gap-(--sp-2)">
            <div className="grid justify-items-end gap-1">
              <span className="t-caption">{SECTION_4.chat.author}</span>
              <p
                className="t-body text-ink"
                style={{
                  maxWidth: '88%',
                  background: 'var(--card)',
                  borderRadius: 'var(--r-card)',
                  padding: 'var(--sp-2)',
                }}
              >
                {SECTION_4.chat.query}
              </p>
            </div>
            <div className="grid justify-items-start gap-1">
              <span className="t-caption">{SECTION_4.chat.replyAuthor}</span>
              <p
                className="t-body text-ink-secondary"
                style={{
                  maxWidth: '88%',
                  background: 'var(--mist)',
                  borderRadius: 'var(--r-card)',
                  padding: 'var(--sp-2)',
                }}
              >
                {SECTION_4.chat.reply}
              </p>
            </div>
          </div>

          {/* Панчлайн — крупный типографический удар сразу после тупого ответа. */}
          <p className="t-heading-lg text-ink" style={{ maxWidth: 'none' }}>
            {SECTION_4.punchline}
          </p>

          <RevealParagraphs paragraphs={SECTION_4.middle} reduced={reduced} />

          <Card label="ПОСЛЕДОВАТЕЛЬНОСТЬ">
            <ol className="grid grid-cols-2 gap-x-4 gap-y-3">
              {SECTION_4.steps.map((step, i) => (
                <li key={step} className="grid grid-cols-[24px_1fr] items-baseline gap-2">
                  <span className="t-caption tnum">{pad2(i + 1)}</span>
                  <span className="t-body-sm text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <RevealParagraphs paragraphs={SECTION_4.after} reduced={reduced} />
        </Section>

        {/* ---- 05 · ПРО ТО, ЧТО БУДЕТ ВНУТРИ — три единицы контента ---- */}
        <Section code={SECTION_5.code} title={SECTION_5.title}>
          <p className="t-body text-ink-secondary">{SECTION_5.lead}</p>

          <div className="grid gap-2">
            {SECTION_5.modules.map((m) => (
              <div key={m.code} className="grid gap-2 rounded-card bg-card p-(--card-pad)">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="t-caption tnum text-ink">{m.code}</span>
                  <span className="t-caption">{m.ordinal}</span>
                </div>
                <h3 className="t-heading text-ink">{m.title}</h3>
                <p className="t-body text-ink-secondary">{m.text}</p>
              </div>
            ))}
          </div>

          <RevealParagraphs paragraphs={SECTION_5.after} reduced={reduced} />
        </Section>

        {/* ---- 06 · ПРО ТО, ЧТО Я ТЕБЕ ПРОДАМ — здесь единственный --voltage экрана ---- */}
        <Section code={SECTION_6.code} title={SECTION_6.title}>
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
        </Section>

        {/* ---- 07 · ЧТО ТЕБЕ ДЕЛАТЬ ---- */}
        <Section code={SECTION_7.code} title={SECTION_7.title}>
          <p className="t-body text-ink-secondary">{SECTION_7.lead}</p>

          <div className="grid gap-(--sp-3)">
            {SECTION_7.options.map((option, i) => (
              <div key={i} className="grid gap-2">
                <span className="t-caption tnum">{pad2(i + 1)}</span>
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

          {/* Финальный акцент — максимальный типографический удар перед кнопкой. */}
          <div className="grid gap-1 pt-(--sp-3)">
            {reduced ? (
              <>
                <p className="t-display text-ink">{SECTION_7.final[0]}</p>
                <p className="t-display text-ink">{SECTION_7.final[1]}</p>
              </>
            ) : (
              <>
                <motion.p
                  className="t-display text-ink"
                  variants={listItem}
                  initial="hidden"
                  whileInView="show"
                  viewport={LOCAL.revealViewport}
                >
                  {SECTION_7.final[0]}
                </motion.p>
                <motion.p
                  className="t-display text-ink"
                  variants={listItem}
                  initial="hidden"
                  whileInView="show"
                  viewport={LOCAL.revealViewport}
                  transition={{ delay: LOCAL.finalLineDelay }}
                >
                  {SECTION_7.final[1]}
                </motion.p>
              </>
            )}
          </div>
        </Section>
      </main>

      {/* Липкая нижняя CTA — появляется после прокрутки первого экрана. Fixed, а не sticky:
          ui/BottomBar рассчитан на одноэкранные шаги воронки (min-h-dvh), а здесь длинный
          скролл-документ, поэтому панель собрана локально: белая арка --r-arc, «выходящая»
          снизу (DESIGN.md §5, §6), safe-area, без тени. Монтируется/размонтируется через
          AnimatePresence — так скрытая кнопка не остаётся в таб-порядке и не перехватывает тапы. */}
      <AnimatePresence>
        {ctaVisible && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-30 bg-card"
            style={{
              borderRadius: 'var(--r-arc) var(--r-arc) 0 0',
              paddingBottom: 'max(var(--sp-2), env(safe-area-inset-bottom))',
            }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={LOCAL.ctaFade}
          >
            <div
              className="mx-auto grid max-w-(--app-max) items-center gap-2 px-(--gutter) pt-(--sp-2)"
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
