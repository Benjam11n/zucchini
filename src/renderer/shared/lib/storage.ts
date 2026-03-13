const STORAGE_EVENT = "storage";

export const STORAGE_KEYS = {
  focusTimer: "zucchini_focus_timer",
  pomodoroSettings: "zucchini_pomodoro_settings",
  todayUiState: "zucchini_last_state",
  weeklyReview: "zucchini_weekly_review",
} as const;

export function readJsonStorage(key: string): unknown | null {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as unknown;
  } catch {
    return null;
  }
}

export function writeJsonStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function subscribeToStorageKey(
  key: string,
  onChange: (value: unknown | null) => void
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
      onChange(JSON.parse(event.newValue) as unknown);
    } catch {
      onChange(null);
    }
  };

  window.addEventListener(STORAGE_EVENT, handleStorage);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handleStorage);
  };
}
