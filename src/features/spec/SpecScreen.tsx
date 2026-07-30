import { Screen } from '../../ui/Screen';
import { BottomBar } from '../../ui/BottomBar';
import { Button } from '../../ui/Button';
import { ChoiceList } from '../../ui/ChoiceList';
import { SCREENS } from '../../content/screens';
import { SPECIALIZATIONS } from '../../content/specializations';
import { useFunnelStore, type Spec } from '../../store/funnel';
import { track } from '../../lib/analytics';
import { haptics } from '../../lib/telegram';

const copy = SCREENS.spec;

// Порядок специализаций = порядок вставки в SPECIALIZATIONS = порядок вариантов в BRIEF.md §2.
// Индексы Choice (01…07) строятся из позиции в этом списке автоматически (ui/ChoiceList.tsx).
const SPEC_OPTIONS = Object.values(SPECIALIZATIONS).map((s) => ({ id: s.id, label: s.label }));

/** Экран выбора специализации (`spec`). Один сценарий воронки — меняются только примеры (PRODUCT.md §5). */
export function SpecScreen() {
  const spec = useFunnelStore((s) => s.spec);
  const setSpec = useFunnelStore((s) => s.setSpec);
  const next = useFunnelStore((s) => s.next);

  const handleChange = (id: string) => {
    setSpec(id as Spec);
    track('spec_select', { spec: id });
  };

  const handleNext = () => {
    if (!spec) return;
    haptics.medium();
    next();
  };

  return (
    <Screen id="spec" phase="know">
      <h1 className="t-display text-ink">{copy.title}</h1>
      <div className="grid gap-3">
        {copy.body?.map((p, i) => (
          <p key={i} className="t-body text-ink-secondary">
            {p}
          </p>
        ))}
      </div>

      <ChoiceList options={SPEC_OPTIONS} value={spec} onChange={handleChange} />

      <BottomBar>
        <Button variant="primary" full disabled={!spec} onClick={handleNext}>
          Дальше
        </Button>
      </BottomBar>
    </Screen>
  );
}
