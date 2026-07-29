import { useEffect } from 'react';
import { Readout } from '../../ui/Readout';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Bullets } from '../../ui/Bullets';
import { Prose } from '../../ui/Prose';
import { Divider } from '../../ui/Divider';
import { SCREENS } from '../../content/screens';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const copy = SCREENS.offer;
const bullets = copy.bullets ?? [];

/**
 * Группировка 19 пунктов «Что внутри» по смыслу (заказчик, аудит продукта: экран читался как
 * отчёт лаборатории) — структурное решение вёрстки, не новый копирайт: заголовки групп
 * авторские (моно-лейблы этого агента), сам текст пунктов — срезы того же массива
 * src/content/screens.ts::SCREENS.offer.bullets, дословно и по порядку брифа.
 */
const BULLET_GROUPS: { heading: string; items: string[] }[] = [
  { heading: 'Доступы и сервисы', items: bullets.slice(0, 4) },
  { heading: 'Codex и скиллы', items: bullets.slice(4, 8) },
  { heading: 'Сборка и исправление ошибок', items: bullets.slice(8, 15) },
  { heading: 'Публикация и работа с клиентом', items: bullets.slice(15, 19) },
];

/**
 * Продающий экран (`offer`) — фаза ПЛАЧУ. Читается как продолжение живой демонстрации
 * (короткая связка сверху → четыре блока того, что внутри → цена → обоснование → кнопки),
 * а не как каталог модулей или отчёт лаборатории: убраны колодец показаний вокруг цены
 * (обычный Well/Readout заменён на крупную цену без приборной рамки) и карточки «пройденных
 * модулей» с цепочкой-визуализацией результата — тот же приборный слой, что и везде в
 * продукте, снесённый аудитом. Единственный на весь экран сигнальный CTA — кнопка оплаты;
 * вторая кнопка ведёт к автопродавцу, а не конкурирует визуально (DESIGN.md §3).
 */
export function OfferScreen() {
  const go = useFunnelStore((s) => s.go);

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
          {/* Связка с демонстрацией, которую человек только что прошёл — не из брифа, короткая
              и нейтральная формулировка этого экрана, а не новый слой копирайта. */}
          <p className="t-body text-ink-muted">
            Я показал принцип на подготовленной системе. Чтобы повторять самому — на своих
            проектах, с чужими данными и чужими правками — нужна техничка.
          </p>
        </div>

        <div className="grid gap-1">
          <p className="t-label text-ink-faint">СТОИМОСТЬ ПРАКТИКУМА</p>
          <Readout value={copy.price ?? 0} suffix="₽" size="lg" />
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

        {copy.quote && (
          <div className="grid gap-2">
            <p className="t-label text-ink-faint">ГЛАВНЫЙ РЕЗУЛЬТАТ</p>
            <p className="t-body text-ink">{copy.quote}</p>
          </div>
        )}

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
