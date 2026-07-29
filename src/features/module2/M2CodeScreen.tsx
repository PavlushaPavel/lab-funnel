import { CodeStepScreen } from '../shared/CodeStepScreen';
import { SCREENS } from '../../content/screens';

/** Код ФОРМУЛА (`m2-code`, BRIEF.md §11) — тонкая обёртка над общим CodeStepScreen. */
export function M2CodeScreen() {
  return <CodeStepScreen stepId="m2-code" moduleId="m2" phase="want" copy={SCREENS['m2-code']} />;
}
