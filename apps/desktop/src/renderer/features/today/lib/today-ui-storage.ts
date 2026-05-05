// Best-effort UI cache. Not source of truth.
import type { PersistedTodayUiState } from "@/renderer/features/today/today.types";
import {
  readJsonStorage,
  STORAGE_KEYS,
  writeJsonStorage,
} from "@/renderer/shared/lib/storage";

function isPersistedTodayUiState(
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
    typeof candidate.streak.bestStreak === "number" &&
    typeof candidate.streak.availableFreezes === "number"
  );
}

export function readLastUiState(): PersistedTodayUiState | null {
  const parsedValue = readJsonStorage(STORAGE_KEYS.todayUiState);
  return isPersistedTodayUiState(parsedValue) ? parsedValue : null;
}

export function writeLastUiState(value: PersistedTodayUiState): void {
  if (!writeJsonStorage(STORAGE_KEYS.todayUiState, value)) {
    // Ignore storage failures; popup history is only best-effort UI memory.
  }
}
