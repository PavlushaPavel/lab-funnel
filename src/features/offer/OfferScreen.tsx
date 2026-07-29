import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Atom, CaretRight } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Well } from '../../ui/Well';
import { Readout } from '../../ui/Readout';
import { Bullets } from '../../ui/Bullets';
import { Prose } from '../../ui/Prose';
import { Divider } from '../../ui/Divider';
import { ElementTile } from '../../ui/ElementTile';
import { SCREENS } from '../../content/screens';
import { MODULES, moduleMass } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import type { ModuleId } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { listStagger, listItem, useReducedMotionSafe } from '../../lib/motion';

const copy = SCREENS.offer;
const bullets = copy.bullets ?? [];
const CHAIN_MODULE_IDS: ModuleId[] = ['m1', 'm2', 'm3'];

/**
 * Группировка 19 пунктов «Что внутри» по смыслу — структурное решение вёрстки, не новый
 * копирайт: заголовки групп авторские (моно-лейблы), сам текст пунктов — срезы того же
 * массива src/content/screens.ts::SCREENS.offer.bullets, дословно и по порядку брифа.
 */
const BULLET_GROUPS: { heading: string; items: string[] }[] = [
  { heading: 'СЕРВИСЫ', items: bullets.slice(0, 4) },
  { heading: 'CODEX И СКИЛЛЫ', items: bullets.slice(4, 8) },
  { heading: 'СБОРКА СТРАНИЦЫ', items: bullets.slice(8, 14) },
  { heading: 'ФИНИШ', items: bullets.slice(14, 19) },
];

/**
 * Цепочка результата разбирается из дословной строки src/content/screens.ts::SCREENS.offer.quote
 * («…путь: анализ → оффер → структура → страница → публикация.») — не переписана руками,
 * чтобы текст остался единственно в content/*, а UI лишь визуализирует перечисление.
 */
function parseResultChain(quote: string): string[] {
  const afterColon = quote.split(':')[1] ?? '';
  return afterColon
    .replace(/\.$/, '')
    .split('→')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Продающий экран (`offer`) — фаза ПЛАЧУ. Единственный на весь экран сигнальный CTA — кнопка
 * оплаты; вторая кнопка ведёт к автопродавцу, а не конкурирует визуально (DESIGN.md §3).
 */
export function OfferScreen() {
  const go = useFunnelStore((s) => s.go);
  const reduced = useReducedMotionSafe();

  const resultChain = useMemo(() => parseResultChain(copy.quote ?? ''), []);

  useEffect(() => {
    track('offer_view');
  }, []);

  const handleBuy = () => {
    haptics.medium();
    track('checkout_click');
    go('checkout');
  };

  const handleAsk = () => {
    haptics.light();
    go('autoseller');
  };

  return (
    <Screen id="offer" phase="pay">
      <div className="grid gap-6 pt-2">
        <div className="grid gap-3">
          <h1 className="t-display-l text-ink">{copy.title}</h1>
          {copy.body?.[0] && <p className="t-body text-ink-muted">{copy.body[0]}</p>}
        </div>

        <div className="grid gap-1">
          <p className="t-label text-ink-faint">СТОИМОСТЬ ПРАКТИКУМА</p>
          <Well>
            <Readout value={copy.price ?? 0} suffix="₽" size="lg" />
          </Well>
        </div>

        <Divider />

        <div className="grid gap-4">
          <p className="t-label text-ink-faint">ЧТО ВНУТРИ</p>
          {BULLET_GROUPS.map((group) => (
            <div key={group.heading} className="grid gap-2">
              <p className="t-label text-ink-faint">{group.heading}</p>
              <Bullets items={group.items} />
            </div>
          ))}
        </div>

        <Divider />

        {copy.bulletsSecondary && (
          <div className="grid gap-2">
            <p className="t-label text-ink-faint">ФОРМАТ</p>
            <Bullets items={copy.bulletsSecondary} />
          </div>
        )}

        <div className="grid gap-4">
          <p className="t-label text-ink-faint">ГЛАВНЫЙ РЕЗУЛЬТАТ</p>

          {/* Три полученных элемента — доказательство пройденного пути, не декорация:
              те же клетки, что горели --sky на m1/m2/m3-code и сходились в ChainScreen (DESIGN.md §6.1). */}
          <div className="grid grid-flow-col items-center justify-start gap-2" style={{ overflowX: 'auto' }}>
            {CHAIN_MODULE_IDS.map((id) => (
              <ElementTile
                key={id}
                number={MODULES[id].number}
                symbol={MODULES[id].symbol}
                name={MODULES[id].title}
                mass={moduleMass(id)}
                state="obtained"
                size="sm"
              />
            ))}
          </div>

          {/* Цепочка результата — свёрстана как отголосок панели «СОЕДИНЕНИЕ» из синтеза
              на экране chain (тот же --sky-контур: результат уже получен, не обещание). */}
          <div
            className="relative grid gap-3 rounded-lg border p-3"
            style={{ borderColor: 'var(--sky)', background: 'var(--sky-dim)' }}
          >
            <div className="flex items-center gap-2">
              <Atom weight="regular" size={16} className="text-sky" aria-hidden="true" />
              <span className="t-label text-sky">СИНТЕЗ ЗАВЕРШЁН</span>
            </div>
            <motion.div
              className="grid grid-flow-col items-center justify-start gap-1"
              style={{ overflowX: 'auto' }}
              variants={reduced ? undefined : listStagger}
              initial={reduced ? undefined : 'hidden'}
              animate={reduced ? undefined : 'show'}
            >
              {resultChain.map((stage, i) => (
                <motion.div key={stage} className="contents" variants={reduced ? undefined : listItem}>
                  <span className="whitespace-nowrap rounded-md border border-line-strong bg-panel px-3 py-2 t-body-s text-ink">
                    {stage}
                  </span>
                  {i < resultChain.length - 1 && (
                    <CaretRight weight="regular" size={12} className="text-ink-faint" aria-hidden="true" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="grid gap-3">
          {/* Обоснование цены — дословно, body[1..]: «Стоимость…», «Не бесплатно.» и далее. */}
          <Prose>
            {copy.body?.slice(1).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>
      </div>

      <BottomBar>
        <Button variant="primary" full onClick={handleBuy}>
          {copy.cta}
        </Button>
        {copy.ctaSecondary && (
          <Button variant="secondary" full onClick={handleAsk}>
            {copy.ctaSecondary}
          </Button>
        )}
      </BottomBar>
    </Screen>
  );
}
