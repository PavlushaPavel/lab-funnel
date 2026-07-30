import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { Prose } from '../../ui/Prose';
import { SCREENS } from '../../content/screens';
import { getReminder } from '../../content/reminders';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics, openLink } from '../../lib/telegram';
import { easeOut, useReducedMotionSafe } from '../../lib/motion';
import { formatRub } from '../../lib/format';

const copy = SCREENS.checkout;

// BRIEF.md §20 «После незавершённой оплаты» — теперь единый источник в content/reminders.ts
// (интеграционная правка волны сшивки: раньше текст был вписан локально прямо в этот файл).
const RETURN_NOTICE = getReminder('after-checkout-abandoned');

/**
 * Переход к оплате (`checkout`). Открывает VITE_CHECKOUT_URL через openLink(); при пустой
 * переменной — честная заглушка с видимым TODO, приложение не падает и не изображает
 * успешную оплату (ARCHITECTURE.md §10). Если пользователь уже нажимал оплату, ушёл из
 * мини-аппа (вкладка/сворачивание) и вернулся — предлагаем автопродавца вместо повторной
 * ссылки в лоб.
 */
export function CheckoutScreen() {
  const go = useFunnelStore((s) => s.go);
  const reduced = useReducedMotionSafe();

  const [showTodo, setShowTodo] = useState(false);
  const [returned, setReturned] = useState(false);
  const attemptedRef = useRef(false);

  const checkoutUrl = import.meta.env.VITE_CHECKOUT_URL;

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && attemptedRef.current) {
        setReturned(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handlePay = () => {
    haptics.medium();
    track('checkout_click');
    attemptedRef.current = true;
    if (checkoutUrl) {
      setShowTodo(false);
      openLink(checkoutUrl);
    } else {
      setShowTodo(true);
    }
  };

  const handleAskAssistant = () => {
    haptics.light();
    track('assistant_open', { from: 'checkout-return' });
    go('autoseller');
  };

  return (
    <Screen id="checkout" phase="pay">
      <div className="grid gap-6 pt-2">
        <div className="grid gap-3">
          <h1 className="t-display text-ink">{copy.title}</h1>
          <Prose>
            {copy.body?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>

        {/* Цена — белая карточка, а не второй инверсный блок: чёрным залит только блок цены
            на продающем экране, здесь приём не повторяется (DESIGN.md §6). */}
        <div className="bg-card rounded-card-lg grid gap-2 p-(--card-pad)">
          <p className="t-caption">К ОПЛАТЕ</p>
          <p className="t-display text-ink tabular-nums">{formatRub(copy.price ?? 0)}</p>
        </div>

        <AnimatePresence>
          {showTodo && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.24, ease: easeOut }}
            >
              <Panel label="TODO">
                <p className="t-body-sm text-ink-secondary">Платёжная ссылка ещё не подключена.</p>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {returned && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.24, ease: easeOut }}
            >
              {/* status='active', не 'scanning': пульсирующая точка — зацикленная анимация,
                  в v3 их всего две и обе заняты (DESIGN.md §7). */}
              <Panel label="ВОЗВРАТ БЕЗ ОПЛАТЫ" status="active">
                <div className="grid gap-3">
                  {RETURN_NOTICE?.body.map((p, i) => (
                    <p key={i} className="t-body-sm text-ink">
                      {p}
                    </p>
                  ))}
                  <Button variant="secondary" full onClick={handleAskAssistant}>
                    {RETURN_NOTICE?.cta}
                  </Button>
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomBar>
        <Button variant="primary" full onClick={handlePay}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
