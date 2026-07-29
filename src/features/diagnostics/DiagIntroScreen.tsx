import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { Prose } from '../../ui/Prose';
import { SCREENS } from '../../content/screens';
import { useFunnelStore } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const copy = SCREENS['diag-intro'];

/** Подводка к тесту (`diag-intro`). Простой экран без декоративной механики. */
export function DiagIntroScreen() {
  const next = useFunnelStore((s) => s.next);

  const handleStart = () => {
    haptics.medium();
    track('quiz_start');
    next();
  };

  return (
    <Screen id="diag-intro" phase="know">
      <h1 className="t-display-l text-ink">{copy.title}</h1>
      <Prose>
        {copy.body?.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </Prose>

      <BottomBar>
        <Button variant="primary" full onClick={handleStart}>
          {copy.cta}
        </Button>
      </BottomBar>
    </Screen>
  );
}
