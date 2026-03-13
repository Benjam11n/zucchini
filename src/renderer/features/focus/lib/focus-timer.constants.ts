import { MS_PER_HOUR, MS_PER_SECOND } from "@/renderer/shared/lib/time";
import { DEFAULT_FOCUS_DURATION_SECONDS } from "@/shared/domain/settings";

export const DEFAULT_FOCUS_DURATION_MS =
  DEFAULT_FOCUS_DURATION_SECONDS * MS_PER_SECOND;
const MIN_FOCUS_DURATION_MS = MS_PER_SECOND;
const MAX_FOCUS_DURATION_MS = MS_PER_HOUR;

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

export function splitFocusDurationMs(durationMs: number): {
  minutes: number;
  seconds: number;
} {
  const totalSeconds = Math.ceil(
    clampFocusDurationMs(durationMs) / MS_PER_SECOND
  );

  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}
