import { useEffect } from 'react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Bullets } from '../../ui/Bullets';
import { Prose } from '../../ui/Prose';
import { SCREENS } from '../../content/screens';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';
import { formatRub } from '../../lib/format';

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
 * Продающий экран (`offer`) — фаза ПЛАЧУ и точка максимального контраста всей воронки.
 * Читается как продолжение живой демонстрации: связка сверху → чёрный инверсный блок с ценой
 * и первичным предложением → четыре карточки «что внутри» → формат → главный результат →
 * дословное обоснование цены → две кнопки.
 *
 * Инверсный блок (DESIGN.md §6) здесь ровно один и он единственный во всей этой группе экранов:
 * приём стирается от повторения, поэтому чёрным залит только блок цены. Приборного слоя
 * (колодец показаний Well/Readout вокруг цены, калибровочные разделители, карточки «пройденных
 * модулей» с визуализацией цепочки) на экране нет: цена набрана дисплейным Oswald с
 * табличными цифрами, секции разделены контрастом поверхностей холст → карточка → инверсия.
 * Единственная первичная CTA — кнопка оплаты; вторая ведёт к автопродавцу и намеренно тише.
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
      <div className="grid gap-(--section-gap) pt-2">
        {/* 1. Связка: заголовок-герой + переход от демонстрации к техничке. */}
        <div className="grid gap-4">
          {/* Дисплей-XL на экране один и он отдан цене (§4), поэтому заголовок — t-display. */}
          <h1 className="t-display text-ink">{copy.title}</h1>
          {/* Связка с демонстрацией, которую человек только что прошёл — не из брифа, короткая
              и нейтральная формулировка этого экрана, а не новый слой копирайта. */}
          <p className="t-body text-ink-secondary">
            Я показал принцип на подготовленной системе. Чтобы повторять самому — на своих
            проектах, с чужими данными и чужими правками — нужна техничка.
          </p>
        </div>

        {/* 2. Цена и первичное предложение — единственный инверсный блок экрана и всей группы.
            Число набрано дисплейным Oswald с табличными цифрами (DESIGN.md §4). */}
        <div className="bg-inverted rounded-card-lg grid gap-4 p-(--card-pad)">
          <p className="t-caption">СТОИМОСТЬ ПРАКТИКУМА</p>
          <p className="t-display-xl text-ink-inverted tabular-nums">
            {formatRub(copy.price ?? 0)}
          </p>
          {copy.body?.[0] && <p className="t-body text-ink-inverted">{copy.body[0]}</p>}
        </div>

        {/* 3. Что внутри — четыре смысловые группы, каждая своей белой карточкой.
            Группировка задана выше и не ломается: карточка = группа. */}
        <div className="grid gap-3">
          <p className="t-caption">ЧТО ВНУТРИ</p>
          {BULLET_GROUPS.map((group, i) => (
            <div key={group.heading} className="bg-card rounded-card grid gap-3 p-(--card-pad)">
              <div className="grid grid-cols-[auto_1fr] items-baseline gap-2">
                <span className="t-caption tabular-nums">{`0${i + 1}`}</span>
                <p className="t-caption text-ink">{group.heading}</p>
              </div>
              <Bullets items={group.items} />
            </div>
          ))}

          {copy.bulletsSecondary && (
            <div className="bg-card rounded-card grid gap-3 p-(--card-pad)">
              <p className="t-caption text-ink">ФОРМАТ</p>
              <Bullets items={copy.bulletsSecondary} />
            </div>
          )}
        </div>

        {/* 4. Главный результат — на холсте, крупнее основного текста. */}
        {copy.quote && (
          <div className="grid gap-2">
            <p className="t-caption">ГЛАВНЫЙ РЕЗУЛЬТАТ</p>
            <p className="t-subheading text-ink">{copy.quote}</p>
          </div>
        )}

        {/* 5. Обоснование цены — дословно, body[1..]: «Стоимость…», «Не бесплатно.» и далее. */}
        <Prose>
          {copy.body?.slice(1).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Prose>
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
