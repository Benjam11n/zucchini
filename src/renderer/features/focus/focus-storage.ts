import type { PersistedFocusTimerState } from "./types";

const FOCUS_TIMER_STORAGE_KEY = "zucchini_focus_timer";
const FOCUS_TIMER_STORAGE_EVENT = "storage";

export function isPersistedFocusTimerState(
  value: unknown
): value is PersistedFocusTimerState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedFocusTimerState>;

  return (
    (candidate.cycleId === null || typeof candidate.cycleId === "string") &&
    (candidate.phase === "focus" || candidate.phase === "break") &&
    (candidate.status === "idle" ||
      candidate.status === "running" ||
      candidate.status === "paused") &&
    (candidate.startedAt === null || typeof candidate.startedAt === "string") &&
    (candidate.endsAt === null || typeof candidate.endsAt === "string") &&
    typeof candidate.remainingMs === "number" &&
    Number.isFinite(candidate.remainingMs) &&
    candidate.remainingMs >= 0 &&
    typeof candidate.lastUpdatedAt === "string"
  );
}

export function readFocusTimerState(): PersistedFocusTimerState | null {
  try {
    const rawValue = localStorage.getItem(FOCUS_TIMER_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    return isPersistedFocusTimerState(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function writeFocusTimerState(value: PersistedFocusTimerState): void {
  try {
    localStorage.setItem(FOCUS_TIMER_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures; timer restore is best effort UI state.
  }
}

export function subscribeToFocusTimerState(
  onChange: (value: PersistedFocusTimerState | null) => void
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== FOCUS_TIMER_STORAGE_KEY) {
      return;
    }

    if (!event.newValue) {
      onChange(null);
      return;
    }

    try {
      const parsedValue = JSON.parse(event.newValue) as unknown;
      onChange(isPersistedFocusTimerState(parsedValue) ? parsedValue : null);
    } catch {
      onChange(null);
    }
  };

  window.addEventListener(FOCUS_TIMER_STORAGE_EVENT, handleStorage);

  return () => {
    window.removeEventListener(FOCUS_TIMER_STORAGE_EVENT, handleStorage);
  };
}
