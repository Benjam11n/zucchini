import type { FocusSession } from "@/shared/domain/focus-session";

export type FocusTimerPhase = "focus" | "break";
export type FocusTimerStatus = "idle" | "running" | "paused";
export type FocusSessionsPhase = "error" | "idle" | "loading" | "ready";

export interface PersistedFocusTimerState {
  cycleId: string | null;
  endsAt: string | null;
  lastUpdatedAt: string;
  phase: FocusTimerPhase;
  remainingMs: number;
  startedAt: string | null;
  status: FocusTimerStatus;
}

export interface FocusTodaySummary {
  completedCount: number;
  totalMinutes: number;
}

export interface FocusTabProps {
  focusSaveErrorMessage: string | null;
  phase: FocusSessionsPhase;
  sessions: FocusSession[];
  sessionsLoadError: Error | null;
  timerState: PersistedFocusTimerState;
  todayDate: string;
  onShowWidget: () => Promise<void>;
  onRetryLoad: () => Promise<void>;
}
