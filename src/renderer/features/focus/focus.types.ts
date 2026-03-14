import type { SettingsSavePhase } from "@/renderer/features/settings/settings.types";
import type { AsyncPhase } from "@/renderer/shared/types/async-phase";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { AppSettings } from "@/shared/domain/settings";

export type FocusTimerPhase = "focus" | "break";
export type FocusTimerStatus = "idle" | "running" | "paused";
export type FocusSessionsPhase = AsyncPhase;
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

export interface FocusTodaySummary {
  completedCount: number;
  totalMinutes: number;
}

export interface FocusPageProps {
  focusSaveErrorMessage: string | null;
  fieldErrors: Partial<Record<keyof AppSettings, string>>;
  phase: FocusSessionsPhase;
  sessions: FocusSession[];
  sessionsLoadError: Error | null;
  settings: AppSettings;
  settingsSavePhase: SettingsSavePhase;
  timerState: PersistedFocusTimerState;
  todayDate: string;
  onChangeSettings: (settings: AppSettings) => void;
  onShowWidget: () => Promise<void>;
  onRetryLoad: () => Promise<void>;
}
