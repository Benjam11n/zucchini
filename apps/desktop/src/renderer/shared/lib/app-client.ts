import type {
  AppCommand,
  ResultForAppCommand,
} from "@/shared/contracts/ipc/app-command-registry";
import type {
  AppQuery,
  ResultForAppQuery,
} from "@/shared/contracts/ipc/app-query-registry";
import type { DayStatusKind } from "@/shared/domain/day-status";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { GoalFrequency } from "@/shared/domain/goal";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import type { InsightsRangeDays } from "@/shared/domain/insights";
import type { AppSettings } from "@/shared/domain/settings";

function command<C extends AppCommand>(
  request: C
): Promise<ResultForAppCommand<C>> {
  return window.desktop.command(request);
}

function query<Q extends AppQuery>(request: Q): Promise<ResultForAppQuery<Q>> {
  return window.desktop.query(request);
}

export const appClient = {
  archiveFocusQuotaGoal: (goalId: number) =>
    command({
      payload: { goalId },
      type: "focusQuotaGoal.archive",
    }),
  archiveHabit: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.archive",
    }),
  createHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency,
    selectedWeekdays?: HabitWeekday[] | null,
    targetCount?: number | null
  ) =>
    command({
      payload: { category, frequency, name, selectedWeekdays, targetCount },
      type: "habit.create",
    }),
  createWindDownAction: (name: string) =>
    command({
      payload: { name },
      type: "windDown.createAction",
    }),
  decrementHabitProgress: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.decrementProgress",
    }),
  deleteWindDownAction: (actionId: number) =>
    command({
      payload: { actionId },
      type: "windDown.deleteAction",
    }),
  getFocusSessions: (limit?: number) =>
    query(
      limit === undefined
        ? { type: "focusSession.list" }
        : {
            payload: { limit },
            type: "focusSession.list",
          }
    ),
  getFocusTimerState: () =>
    query({
      type: "focusTimer.getState",
    }),
  getHabits: () =>
    query({
      type: "habit.list",
    }),
  getHistory: (limit?: number) =>
    query(
      limit === undefined
        ? { type: "history.get" }
        : {
            payload: { limit },
            type: "history.get",
          }
    ),
  getHistoryDay: (date: string) =>
    query({
      payload: { date },
      type: "history.getDay",
    }),
  getHistoryForYear: (year: number) =>
    query({
      payload: { year },
      type: "history.getYear",
    }),
  getHistorySummary: (limit?: number) =>
    query(
      limit === undefined
        ? { type: "history.summary" }
        : {
            payload: { limit },
            type: "history.summary",
          }
    ),
  getHistorySummaryForMonth: (year: number, month: number) =>
    query({
      payload: { month, year },
      type: "history.summaryMonth",
    }),
  getHistorySummaryForYear: (year: number) =>
    query({
      payload: { year },
      type: "history.summaryYear",
    }),
  getHistoryYears: () =>
    query({
      type: "history.years",
    }),
  getInsightsDashboard: (rangeDays?: InsightsRangeDays) =>
    query(
      rangeDays === undefined
        ? { type: "insights.dashboard" }
        : {
            payload: { rangeDays },
            type: "insights.dashboard",
          }
    ),
  getTodayState: () =>
    query({
      type: "today.get",
    }),
  getWeeklyReview: (weekStart: string) =>
    query({
      payload: { weekStart },
      type: "weeklyReview.get",
    }),
  getWeeklyReviewOverview: () =>
    query({
      type: "weeklyReview.overview",
    }),
  incrementHabitProgress: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.incrementProgress",
    }),
  moveUnfinishedHabitsToTomorrow: () =>
    command({
      type: "today.moveUnfinishedToTomorrow",
    }),
  pauseHabit: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.pause",
    }),
  recordFocusSession: (input: CreateFocusSessionInput) =>
    command({
      payload: input,
      type: "focusSession.record",
    }),
  renameHabit: (habitId: number, name: string) =>
    command({
      payload: { habitId, name },
      type: "habit.rename",
    }),
  renameWindDownAction: (actionId: number, name: string) =>
    command({
      payload: { actionId, name },
      type: "windDown.renameAction",
    }),
  reorderHabits: (habitIds: number[]) =>
    command({
      payload: { habitIds },
      type: "habit.reorder",
    }),
  resumeHabit: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.resume",
    }),
  saveFocusTimerState: (state: PersistedFocusTimerState) =>
    command({
      payload: state,
      type: "focusTimer.saveState",
    }),
  setDayStatus: (kind: DayStatusKind | null) =>
    command({
      payload: { kind },
      type: "today.setDayStatus",
    }),
  toggleHabit: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.toggle",
    }),
  toggleHabitCarryover: (sourceDate: string, habitId: number) =>
    command({
      payload: { habitId, sourceDate },
      type: "today.toggleCarryover",
    }),
  toggleSickDay: () =>
    command({
      type: "today.toggleSickDay",
    }),
  toggleWindDownAction: (actionId: number) =>
    command({
      payload: { actionId },
      type: "windDown.toggleAction",
    }),
  unarchiveFocusQuotaGoal: (goalId: number) =>
    command({
      payload: { goalId },
      type: "focusQuotaGoal.unarchive",
    }),
  unarchiveHabit: (habitId: number) =>
    command({
      payload: { habitId },
      type: "habit.unarchive",
    }),
  updateHabitCategory: (habitId: number, category: HabitCategory) =>
    command({
      payload: { category, habitId },
      type: "habit.updateCategory",
    }),
  updateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount?: number | null
  ) =>
    command({
      payload: { frequency, habitId, targetCount },
      type: "habit.updateFrequency",
    }),
  updateHabitTargetCount: (habitId: number, targetCount: number) =>
    command({
      payload: { habitId, targetCount },
      type: "habit.updateTargetCount",
    }),
  updateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null
  ) =>
    command({
      payload: { habitId, selectedWeekdays },
      type: "habit.updateWeekdays",
    }),
  updateSettings: (settings: AppSettings) =>
    command({
      payload: settings,
      type: "settings.update",
    }),
  upsertFocusQuotaGoal: (frequency: GoalFrequency, targetMinutes: number) =>
    command({
      payload: { frequency, targetMinutes },
      type: "focusQuotaGoal.upsert",
    }),
};
