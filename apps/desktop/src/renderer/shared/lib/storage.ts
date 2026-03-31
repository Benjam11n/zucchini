/**
 * Local storage utilities for renderer-persisted cache state.
 *
 * Provides typed JSON read/write helpers for `localStorage`. Used by
 * feature-local cache layers (today UI snapshot, weekly review last-seen)
 * that are non-authoritative — canonical state lives in SQLite.
 */
import type { JsonValue } from "@/shared/types/json";

export const STORAGE_KEYS = {
  todayUiState: "zucchini_last_state",
  updateToastDismissal: "zucchini_update_toast_dismissal",
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

export function removeStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
