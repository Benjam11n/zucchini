/**
 * Focus timer persisted state domain types.
 *
 * Represents the full Pomodoro timer state that is saved to the database
 * and synced across renderer windows via IPC. Includes phase (focus/break),
 * status (idle/running/paused), remaining time, and cycle tracking.
 */
export type FocusTimerPhase = "focus" | "break";
export type FocusTimerStatus = "idle" | "running" | "paused";
export type FocusBreakVariant = "short" | "long";

export interface PersistedCompletedBreakState {
  completedAt: string;
  timerSessionId: string;
  variant: FocusBreakVariant;
}

export interface PersistedFocusTimerState {
  breakVariant: FocusBreakVariant | null;
  cycleId: string | null;
  completedFocusCycles: number;
  endsAt: string | null;
  focusDurationMs: number;
  lastCompletedBreak: PersistedCompletedBreakState | null;
  lastUpdatedAt: string;
  phase: FocusTimerPhase;
  remainingMs: number;
  startedAt: string | null;
  status: FocusTimerStatus;
  timerSessionId: string | null;
}

function arePersistedCompletedBreakStatesEqual(
  left: PersistedCompletedBreakState | null,
  right: PersistedCompletedBreakState | null
): boolean {
  if (left === right) {
    return true;
  }

  if (left === null || right === null) {
    return false;
  }

  return (
    left.completedAt === right.completedAt &&
    left.timerSessionId === right.timerSessionId &&
    left.variant === right.variant
  );
}

export function arePersistedFocusTimerStatesEqual(
  left: PersistedFocusTimerState | null,
  right: PersistedFocusTimerState | null
): boolean {
  if (left === right) {
    return true;
  }

  if (left === null || right === null) {
    return false;
  }

  return (
    left.breakVariant === right.breakVariant &&
    left.completedFocusCycles === right.completedFocusCycles &&
    left.cycleId === right.cycleId &&
    left.endsAt === right.endsAt &&
    left.focusDurationMs === right.focusDurationMs &&
    arePersistedCompletedBreakStatesEqual(
      left.lastCompletedBreak,
      right.lastCompletedBreak
    ) &&
    left.lastUpdatedAt === right.lastUpdatedAt &&
    left.phase === right.phase &&
    left.remainingMs === right.remainingMs &&
    left.startedAt === right.startedAt &&
    left.status === right.status &&
    left.timerSessionId === right.timerSessionId
  );
}
