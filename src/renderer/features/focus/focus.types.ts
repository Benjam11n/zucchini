import type { SettingsSavePhase } from "@/renderer/features/settings/settings.types";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { AppSettings } from "@/shared/domain/settings";

export type FocusTimerPhase = "focus" | "break";
export type FocusTimerStatus = "idle" | "running" | "paused";
export type FocusSessionsPhase = "error" | "idle" | "loading" | "ready";
export type FocusBreakVariant = "short" | "long";

export interface PersistedFocusTimerState {
  breakVariant: FocusBreakVariant | null;
  cycleId: string | null;
  completedFocusCycles: number;
  endsAt: string | null;
  focusDurationMs: number;
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
