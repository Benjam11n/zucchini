import type { JsonValue } from "@/shared/types/json";

export const STORAGE_KEYS = {
  todayUiState: "zucchini_last_state",
  weeklyReview: "zucchini_weekly_review",
} as const;

export function readJsonStorage(key: string): JsonValue | null {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as JsonValue;
  } catch {
    // CHECK: this collapses "missing", "malformed JSON", and storage access
    // failures into the same null path. Is that ambiguity acceptable for all
    // current callers?
    return null;
  }
}

export function writeJsonStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
