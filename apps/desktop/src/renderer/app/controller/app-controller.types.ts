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
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import type {
  InsightsDashboard,
  InsightsRangeDays,
} from "@/shared/domain/insights";
import type { AppSettings } from "@/shared/domain/settings";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import type { TodayState } from "@/shared/read-models/today-state";

export interface AppControllerState {
  bootError: AppIpcError | null;
  bootPhase: "error" | "loading" | "ready";
  contributionHistory: HistorySummaryDay[];
  focusSaveErrorMessage: string | null;
  focusSessions: FocusSession[];
  focusSessionsLoadError: AppIpcError | null;
  focusSessionsPhase: FocusSessionsPhase;
  hasLoadedFocusSessions: boolean;
  history: HistorySummaryDay[];
  historyDayByDate: Record<string, HistoryDay | undefined>;
  historyYears: number[];
  historyLoadError: AppIpcError | null;
  historySummary: HistorySummaryDay[];
  hasLoadedHistorySummary: boolean;
  insightsDashboard: InsightsDashboard | null;
  insightsError: AppIpcError | null;
  insightsPhase: "error" | "idle" | "loading" | "ready";
  insightsRangeDays: InsightsRangeDays;
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
  weeklyReviewError: AppIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: WeeklyReviewPhase;
}
