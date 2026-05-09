import { MS_PER_SECOND } from "@/renderer/shared/lib/time";
import { APP_CONFIG } from "@/shared/config/app-config";

export const DEFAULT_FOCUS_DURATION_MS =
  APP_CONFIG.focus.defaultDurations.focusSeconds * MS_PER_SECOND;
const MIN_FOCUS_DURATION_MS =
  APP_CONFIG.focus.durationRanges.focusSeconds.min * MS_PER_SECOND;
const MAX_FOCUS_DURATION_MS =
  APP_CONFIG.focus.durationRanges.focusSeconds.max * MS_PER_SECOND;

export function clampFocusDurationMs(durationMs: number): number {
  return Math.min(
    MAX_FOCUS_DURATION_MS,
    Math.max(
      MIN_FOCUS_DURATION_MS,
      Math.round(durationMs / MS_PER_SECOND) * MS_PER_SECOND
    )
  );
}

export function focusDurationSecondsToMs(durationSeconds: number): number {
  return clampFocusDurationMs(durationSeconds * MS_PER_SECOND);
}
