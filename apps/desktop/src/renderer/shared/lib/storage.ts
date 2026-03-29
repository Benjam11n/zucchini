import type { JsonValue } from "@/shared/types/json";

const STORAGE_EVENT = "storage";

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

export function subscribeToStorageKey(
  key: string,
  onChange: (value: JsonValue | null) => void
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== key) {
      return;
    }

    if (!event.newValue) {
      onChange(null);
      return;
    }

    try {
      onChange(JSON.parse(event.newValue) as JsonValue);
    } catch {
      onChange(null);
    }
  };

  window.addEventListener(STORAGE_EVENT, handleStorage);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handleStorage);
  };
}
