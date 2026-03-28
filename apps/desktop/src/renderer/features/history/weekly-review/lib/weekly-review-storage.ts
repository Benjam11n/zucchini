import {
  readJsonStorage,
  STORAGE_KEYS,
  writeJsonStorage,
} from "@/renderer/shared/lib/storage";

interface PersistedWeeklyReviewState {
  lastSeenWeeklyReviewStart: string | null;
}

export function isPersistedWeeklyReviewState(
  value: unknown
): value is PersistedWeeklyReviewState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedWeeklyReviewState>;
  return (
    candidate.lastSeenWeeklyReviewStart === null ||
    typeof candidate.lastSeenWeeklyReviewStart === "string"
  );
}

export function readLastSeenWeeklyReviewStart(): string | null {
  const parsedValue = readJsonStorage(STORAGE_KEYS.weeklyReview);
  return isPersistedWeeklyReviewState(parsedValue)
    ? parsedValue.lastSeenWeeklyReviewStart
    : null;
}

export function writeLastSeenWeeklyReviewStart(weekStart: string): void {
  if (
    !writeJsonStorage(STORAGE_KEYS.weeklyReview, {
      lastSeenWeeklyReviewStart: weekStart,
    } satisfies PersistedWeeklyReviewState)
  ) {
    // Ignore storage failures; weekly review spotlight memory is best-effort.
  }
}
