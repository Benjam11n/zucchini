/**
 * App controller type definitions.
 *
 * Describes the full shape of state returned by the `useAppController` hook.
 * This interface aggregates data from every feature store (boot, today, focus,
 * history, settings, weekly review) into a single read-model consumed by the
 * app shell and page components.
 */
import type {
  FocusSessionsPhase,
  PersistedFocusTimerState,
} from "@/renderer/features/focus/focus.types";
import type { WeeklyReviewPhase } from "@/renderer/features/history/history.types";
import type {
  SettingsFieldErrors,
  SettingsSavePhase,
} from "@/renderer/features/settings/settings.types";
import type { HabitsIpcError } from "@/shared/contracts/habits-ipc-errors";
import type { TodayState } from "@/shared/contracts/today-state";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import type { AppSettings } from "@/shared/domain/settings";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

export interface AppControllerState {
  bootError: HabitsIpcError | null;
  bootPhase: "error" | "loading" | "ready";
  contributionHistory: HistorySummaryDay[];
  focusSaveErrorMessage: string | null;
  focusSessions: FocusSession[];
  focusSessionsLoadError: HabitsIpcError | null;
  focusSessionsPhase: FocusSessionsPhase;
  hasLoadedFocusSessions: boolean;
  history: HistorySummaryDay[];
  historyDayByDate: Record<string, HistoryDay | undefined>;
  historyYears: number[];
  historyLoadError: HabitsIpcError | null;
  historySummary: HistorySummaryDay[];
  hasLoadedHistorySummary: boolean;
  isHistoryLoading: boolean;
  isHistoryDayLoading: boolean;
  loadingHistoryDayKey: string | null;
  isWeeklyReviewSpotlightOpen: boolean;
  managedHabits: Habit[];
  selectedWeeklyReview: WeeklyReview | null;
  settingsDraft: AppSettings | null;
  settingsFieldErrors: SettingsFieldErrors;
  settingsSaveErrorMessage: string | null;
  settingsSavePhase: SettingsSavePhase;
  selectedHistoryYear: number | null;
  timerState: PersistedFocusTimerState;
  todayState: TodayState | null;
  weeklyReviewError: HabitsIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
}
