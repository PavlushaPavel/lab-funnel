import { CodeStepScreen } from '../shared/CodeStepScreen';
import { SCREENS } from '../../content/screens';

/** Код БРИФ (`m1-code`, BRIEF.md §7) — тонкая обёртка над общим CodeStepScreen. */
export function M1CodeScreen() {
  return <CodeStepScreen stepId="m1-code" moduleId="m1" phase="want" copy={SCREENS['m1-code']} />;
}
