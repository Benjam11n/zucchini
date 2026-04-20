/**
 * Focus session domain types.
 *
 * Represents a completed or partial Pomodoro/focus session persisted to the
 * database. Used by both the main-process repository and the renderer's
 * focus store.
 */
export type FocusSessionEntryKind = "completed" | "partial";

export interface FocusSession {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  entryKind: FocusSessionEntryKind;
  id: number;
  startedAt: string;
  timerSessionId: string;
}

export interface CreateFocusSessionInput {
  completedAt: string;
  completedDate: string;
  durationSeconds: number;
  entryKind: FocusSessionEntryKind;
  startedAt: string;
  timerSessionId: string;
}

export function toFocusMinutes(totalSeconds: number): number {
  if (totalSeconds <= 0) {
    return 0;
  }

  return Math.max(1, Math.round(totalSeconds / 60));
}
