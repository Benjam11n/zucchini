/**
 * Focus page type definitions.
 *
 * Re-exports focus timer domain types and defines the `FocusPageProps`
 * interface consumed by the focus page component. Also includes the
 * `FocusTodaySummary` type for daily completion stats.
 */
import type { AsyncPhase } from "@/renderer/shared/types/async-phase";
import type { SettingsSavePhase } from "@/renderer/shared/types/settings";
import type { FocusSession } from "@/shared/domain/focus-session";
import type {
  FocusBreakVariant,
  PersistedCompletedBreakState,
  PersistedFocusTimerState,
} from "@/shared/domain/focus-timer";
import type {
  FocusQuotaGoalWithStatus,
  GoalFrequency,
} from "@/shared/domain/goal";
import type { AppSettings } from "@/shared/domain/settings";

export type FocusSessionsPhase = AsyncPhase;
export type {
  FocusBreakVariant,
  PersistedCompletedBreakState,
  PersistedFocusTimerState,
};

export interface FocusTodaySummary {
  completedCount: number;
  totalMinutes: number;
}

export interface FocusPageProps {
  focusSaveErrorMessage: string | null;
  focusQuotaGoals?: FocusQuotaGoalWithStatus[];
  fieldErrors: Partial<Record<keyof AppSettings, string>>;
  phase: FocusSessionsPhase;
  sessions: FocusSession[];
  sessionsLoadError: Error | null;
  settings: AppSettings;
  settingsSavePhase: SettingsSavePhase;
  timerState: PersistedFocusTimerState;
  todayDate: string;
  onArchiveFocusQuotaGoal?: (goalId: number) => Promise<void>;
  onChangeSettings: (settings: AppSettings) => void;
  onShowWidget: () => Promise<void>;
  onUpsertFocusQuotaGoal?: (
    frequency: GoalFrequency,
    targetMinutes: number
  ) => Promise<void>;
  onRetryLoad: () => Promise<void>;
}
