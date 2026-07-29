import { TickRail } from './TickRail';

/** Разделитель секций — калибровочная шкала без заливки, уходит в край экрана (DESIGN.md §5, §6.1). */
export function Divider() {
  return (
    <div role="separator" aria-hidden="true" className="w-full">
      <TickRail progress={0} height={10} />
    </div>
  );
}
