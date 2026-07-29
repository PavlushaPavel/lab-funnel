import { Lock } from '@phosphor-icons/react';
import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { Prose } from '../../ui/Prose';
import { SCREENS } from '../../content/screens';
import { MODULES } from '../../content/modules';
import { useFunnelStore } from '../../store/funnel';
import { haptics } from '../../lib/telegram';

const copy = SCREENS['m1-intro'];
const MODULE = MODULES.m1;

/**
 * Подводка перед видео модуля 1 (`m1-intro`, BRIEF.md §6). Короткая и ударная — карточка
 * узла показана заперто, чтобы человек увидел, что сейчас откроется (PRODUCT.md §3.3).
 */
export function M1IntroScreen() {
  const next = useFunnelStore((s) => s.next);

  const handleNext = () => {
    haptics.medium();
    next();
  };

  return (
    <Screen id="m1-intro" phase="want">
      <h1 className="t-display-l text-ink">{copy.title}</h1>
      <Prose>
        {copy.body?.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </Prose>

      <Panel label={`${MODULE.code} · ${MODULE.title}`} status="locked">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3">
          <Lock weight="regular" size={22} color="var(--ink-faint)" aria-hidden="true" />
          <span className="t-label text-ink-faint">УЗЕЛ ЗАБЛОКИРОВАН</span>
        </div>
      </Panel>

      <BottomBar>
        <Button variant="primary" full onClick={handleNext}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
