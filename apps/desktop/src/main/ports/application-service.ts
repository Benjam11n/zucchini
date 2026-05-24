import type {
  HabitCommand,
  HabitCommandResult,
} from "@/shared/contracts/ipc/habits-command-registry";
import type {
  HabitQuery,
  HabitQueryResult,
} from "@/shared/contracts/ipc/habits-query-registry";
import type { DayStatusKind } from "@/shared/domain/day-status";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { GoalFrequency } from "@/shared/domain/goal";
import type {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import type {
  InsightsDashboard,
  InsightsRangeDays,
} from "@/shared/domain/insights";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import type { AppSettings } from "@/shared/domain/settings";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";
import type { HabitStatusPatch } from "@/shared/read-models/habit-status-patch";
import type { TodayState } from "@/shared/read-models/today-state";

export interface ApplicationService {
  execute(command: HabitCommand): HabitCommandResult;
  read(query: HabitQuery): HabitQueryResult;
  initialize(): void;
  getHabits(): Habit[];
  getTodayState(): TodayState;
  moveUnfinishedHabitsToTomorrow(): TodayState;
  setDayStatus(kind: DayStatusKind | null): TodayState;
  toggleHabitCarryover(sourceDate: string, habitId: number): TodayState;
  toggleSickDay(): TodayState;
  toggleHabit(habitId: number): HabitStatusPatch;
  incrementHabitProgress(habitId: number): HabitStatusPatch;
  decrementHabitProgress(habitId: number): HabitStatusPatch;
  pauseHabit(habitId: number): TodayState;
  resumeHabit(habitId: number): TodayState;
  getFocusSessions(limit?: number): FocusSession[];
  recordFocusSession(input: CreateFocusSessionInput): FocusSession;
  getPersistedFocusTimerState(): PersistedFocusTimerState | null;
  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState;
  getHistory(limit?: number): HistoryDay[];
  getHistoryForYear(year: number): HistoryDay[];
  getHistoryDay(date: string): HistoryDay;
  getHistorySummary(limit?: number): HistorySummaryDay[];
  getHistorySummaryForYear(year: number): HistorySummaryDay[];
  getHistorySummaryForMonth(year: number, month: number): HistorySummaryDay[];
  getHistoryYears(): number[];
  getWeeklyReviewOverview(): WeeklyReviewOverview;
  getWeeklyReview(weekStart: string): WeeklyReview;
  getInsightsDashboard(rangeDays?: InsightsRangeDays): InsightsDashboard;
  getReminderRuntimeState(): ReminderRuntimeState;
  updateSettings(settings: AppSettings): AppSettings;
  saveReminderRuntimeState(state: ReminderRuntimeState): void;
  getWindDownRuntimeState(): WindDownRuntimeState;
  saveWindDownRuntimeState(state: WindDownRuntimeState): void;
  createHabit(
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ): TodayState;
  renameHabit(habitId: number, name: string): TodayState;
  updateHabitCategory(habitId: number, category: HabitCategory): TodayState;
  updateHabitFrequency(
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ): TodayState;
  updateHabitTargetCount(habitId: number, targetCount: number): TodayState;
  updateHabitWeekdays(
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ): TodayState;
  upsertFocusQuotaGoal(
    frequency: GoalFrequency,
    targetMinutes: number
  ): TodayState;
  archiveFocusQuotaGoal(goalId: number): TodayState;
  unarchiveFocusQuotaGoal(goalId: number): TodayState;
  archiveHabit(habitId: number): TodayState;
  unarchiveHabit(habitId: number): TodayState;
  reorderHabits(habitIds: number[]): TodayState;
  createWindDownAction(name: string): TodayState;
  renameWindDownAction(actionId: number, name: string): TodayState;
  deleteWindDownAction(actionId: number): TodayState;
  toggleWindDownAction(actionId: number): TodayState;
}

export type {
  AppSettings,
  CreateFocusSessionInput,
  DayStatusKind,
  FocusSession,
  GoalFrequency,
  Habit,
  HabitCategory,
  HabitCommand,
  HabitCommandResult,
  HabitFrequency,
  HabitQuery,
  HabitQueryResult,
  HabitStatusPatch,
  HabitWeekday,
  HistoryDay,
  HistorySummaryDay,
  InsightsDashboard,
  InsightsRangeDays,
  PersistedFocusTimerState,
  ReminderRuntimeState,
  TodayState,
  WeeklyReview,
  WeeklyReviewOverview,
  WindDownRuntimeState,
};
