import { VideoStepScreen } from '../shared/VideoStepScreen';

/** Видео 1 (`m1-video`, BRIEF.md §6) — тонкая обёртка над общим VideoStepScreen. */
export function M1VideoScreen() {
  return <VideoStepScreen stepId="m1-video" videoId="m1-video" moduleId="m1" phase="want" />;
}
