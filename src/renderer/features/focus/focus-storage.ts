import {
  clampFocusDurationMs,
  DEFAULT_FOCUS_DURATION_MS,
} from "./focus-timer-constants";
import type { PersistedFocusTimerState } from "./types";

const FOCUS_TIMER_STORAGE_KEY = "zucchini_focus_timer";
const FOCUS_TIMER_STORAGE_EVENT = "storage";

function parsePersistedFocusTimerState(
  value: unknown
): PersistedFocusTimerState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<PersistedFocusTimerState>;
  const focusDurationMs =
    typeof candidate.focusDurationMs === "number" &&
    Number.isFinite(candidate.focusDurationMs)
      ? clampFocusDurationMs(candidate.focusDurationMs)
      : DEFAULT_FOCUS_DURATION_MS;

  if (
    !(candidate.cycleId === null || typeof candidate.cycleId === "string") ||
    !(candidate.phase === "focus" || candidate.phase === "break") ||
    !(
      candidate.status === "idle" ||
      candidate.status === "running" ||
      candidate.status === "paused"
    ) ||
    !(
      candidate.startedAt === null || typeof candidate.startedAt === "string"
    ) ||
    !(candidate.endsAt === null || typeof candidate.endsAt === "string") ||
    typeof candidate.remainingMs !== "number" ||
    !Number.isFinite(candidate.remainingMs) ||
    candidate.remainingMs < 0 ||
    typeof candidate.lastUpdatedAt !== "string"
  ) {
    return null;
  }

  return {
    cycleId: candidate.cycleId,
    endsAt: candidate.endsAt,
    focusDurationMs,
    lastUpdatedAt: candidate.lastUpdatedAt,
    phase: candidate.phase,
    remainingMs: candidate.remainingMs,
    startedAt: candidate.startedAt,
    status: candidate.status,
  };
}

export function isPersistedFocusTimerState(
  value: unknown
): value is PersistedFocusTimerState {
  const candidate = parsePersistedFocusTimerState(value);

  return candidate !== null;
}

export function readFocusTimerState(): PersistedFocusTimerState | null {
  try {
    const rawValue = localStorage.getItem(FOCUS_TIMER_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return parsePersistedFocusTimerState(JSON.parse(rawValue) as unknown);
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
      onChange(parsePersistedFocusTimerState(JSON.parse(event.newValue)));
    } catch {
      onChange(null);
    }
  };

  window.addEventListener(FOCUS_TIMER_STORAGE_EVENT, handleStorage);

  return () => {
    window.removeEventListener(FOCUS_TIMER_STORAGE_EVENT, handleStorage);
  };
}
