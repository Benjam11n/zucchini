import type { PersistedTodayUiState } from "./types";

const LAST_STATE_STORAGE_KEY = "zucchini_last_state";

export function isPersistedTodayUiState(
  value: unknown
): value is PersistedTodayUiState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedTodayUiState>;
  return (
    typeof candidate.completedCount === "number" &&
    typeof candidate.date === "string" &&
    !!candidate.streak &&
    typeof candidate.streak.currentStreak === "number" &&
    typeof candidate.streak.availableFreezes === "number"
  );
}

export function readLastUiState(): PersistedTodayUiState | null {
  try {
    const rawValue = localStorage.getItem(LAST_STATE_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    return isPersistedTodayUiState(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function writeLastUiState(value: PersistedTodayUiState): void {
  try {
    localStorage.setItem(LAST_STATE_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures; popup history is only best-effort UI memory.
  }
}
