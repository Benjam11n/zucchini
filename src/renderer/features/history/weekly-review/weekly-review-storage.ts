const WEEKLY_REVIEW_STORAGE_KEY = "zucchini_weekly_review";

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
  try {
    const rawValue = localStorage.getItem(WEEKLY_REVIEW_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    return isPersistedWeeklyReviewState(parsedValue)
      ? parsedValue.lastSeenWeeklyReviewStart
      : null;
  } catch {
    return null;
  }
}

export function writeLastSeenWeeklyReviewStart(weekStart: string): void {
  try {
    localStorage.setItem(
      WEEKLY_REVIEW_STORAGE_KEY,
      JSON.stringify({
        lastSeenWeeklyReviewStart: weekStart,
      } satisfies PersistedWeeklyReviewState)
    );
  } catch {
    // Ignore storage failures; weekly review spotlight memory is best-effort.
  }
}
