import { DEFAULT_FOCUS_DURATION_SECONDS } from "@/shared/domain/settings";

export const DEFAULT_FOCUS_DURATION_MS = DEFAULT_FOCUS_DURATION_SECONDS * 1000;
const MIN_FOCUS_DURATION_MS = 1000;
const MAX_FOCUS_DURATION_MS = 60 * 60 * 1000;

export function clampFocusDurationMs(durationMs: number): number {
  return Math.min(
    MAX_FOCUS_DURATION_MS,
    Math.max(MIN_FOCUS_DURATION_MS, Math.round(durationMs / 1000) * 1000)
  );
}

export function focusDurationSecondsToMs(durationSeconds: number): number {
  return clampFocusDurationMs(durationSeconds * 1000);
}

export function splitFocusDurationMs(durationMs: number): {
  minutes: number;
  seconds: number;
} {
  const totalSeconds = Math.ceil(clampFocusDurationMs(durationMs) / 1000);

  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}
