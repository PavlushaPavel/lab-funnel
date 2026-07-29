import { VideoStepScreen } from '../shared/VideoStepScreen';

/** Видео 2 (`m2-video`, BRIEF.md §10) — тонкая обёртка над общим VideoStepScreen. */
export function M2VideoScreen() {
  return <VideoStepScreen stepId="m2-video" videoId="m2-video" moduleId="m2" phase="want" />;
}
